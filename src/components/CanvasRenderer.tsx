"use client";

import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useDesign, getCanvasDimensions } from "@/context/DesignContext";
import { autoFitText, drawGradientBg, drawRoundedRect, getTemplateTransform, wrapText, type ImageDrawRect } from "@/lib/canvasUtils";
import { computeBoxFromAnchor, type Rect } from "@/lib/resizeUtils";
import { useElementEditor, type EditableItem } from "@/hooks/useElementEditor";
import SelectionOverlay from "./SelectionOverlay";

interface TemplateElement {
  id: string;
  type: string;
  default_text: string;
  position?: { x: number; y: number };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  font_size?: number;
  fontSize?: number;
  font_family?: string;
  fontFamily?: string;
  font_weight?: string;
  fontWeight?: string;
  color: string;
  alignment: string;
  text_transform?: string;
}

interface TemplateMappingConfig {
  template_name?: string;
  templateName?: string;
  canvas_size?: { width: number; height: number };
  canvasSize?: { width: number; height: number };
  elements: TemplateElement[];
}

interface FestivalTemplate {
  id: number;
  image: string;
  mapping: string;
  canvas_dim: { w: number; h: number };
}

interface FestivalData {
  label: string;
  templateCount: number;
  templates: FestivalTemplate[];
}

interface FestivalsResponse {
  festivals: Record<string, FestivalData>;
}

interface CanvasRendererProps {
  variantIndex: number;
  isMain?: boolean;
}

const HIT_PADDING = 40;
const LINE_HEIGHT_RATIO = 1.3;
// Mapping JSONs sit slightly too high/left on the template; shift them down by
// 19px and right by 2px (on the 1080 canvas) while keeping scale at 100%.
const JSON_OFFSET_X_RATIO = 2 / 1080;
const JSON_OFFSET_Y_RATIO = 19 / 1080;

const CanvasRenderer = ({ variantIndex, isMain = false }: CanvasRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);
  const [templateMappingConfig, setTemplateMappingConfig] = useState<TemplateMappingConfig | null>(null);
  const { state, dispatch } = useDesign();
  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(state);

  // Stable dispatch access for effects (wrappedDispatch identity changes every
  // render, so it must not appear in effect dependency arrays).
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;

  // Where the template image actually lands on the canvas (contain strategy).
  // Falls back to the full canvas when there is no image so the mapping JSON
  // still lays out proportionally against the procedural gradient.
  const imageDrawRect = useMemo<ImageDrawRect>(() => {
    if (!templateImage) {
      return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    }
    const imgRatio = templateImage.width / templateImage.height;
    const canvasRatio = canvasWidth / canvasHeight;
    let x = 0, y = 0, w = canvasWidth, h = canvasHeight;
    if (imgRatio > canvasRatio) {
      h = canvasWidth / imgRatio;
      y = (canvasHeight - h) / 2;
    } else {
      w = canvasHeight * imgRatio;
      x = (canvasWidth - w) / 2;
    }
    return { x, y, width: w, height: h };
  }, [templateImage, canvasWidth, canvasHeight]);

  const jsonSize = useMemo(() => {
    const cs = templateMappingConfig?.canvasSize || templateMappingConfig?.canvas_size;
    return cs && cs.width > 0 && cs.height > 0 ? cs : null;
  }, [templateMappingConfig]);

  // Mapping JSONs are authored in the JSON's canvasSize (e.g. the
  // frame-text-editor's 1080×1080) and map 1:1 onto the template image at 100%
  // scale. The JSON sits slightly too high/left, so shift the target rect down
  // by 19px and right by 2px (scale stays untouched).
  const transformRect = useMemo<ImageDrawRect>(() => ({
    x: imageDrawRect.x + imageDrawRect.width * JSON_OFFSET_X_RATIO,
    y: imageDrawRect.y + imageDrawRect.height * JSON_OFFSET_Y_RATIO,
    width: imageDrawRect.width,
    height: imageDrawRect.height,
  }), [imageDrawRect]);

  const templateTransform = useMemo(
    () => getTemplateTransform(jsonSize, transformRect),
    [jsonSize, transformRect]
  );

  const deletedElementIds = state.deletedElementIds;
  const matrixConfig = useMemo(() => {
    return (state.variantConfigs && state.variantConfigs.length > 0)
      ? state.variantConfigs[variantIndex % state.variantConfigs.length]
      : {
          logoAnchor: "top-left" as const,
          textLayout: "vertical-sidebar" as const,
          fontCategory: "luxury" as const,
        };
  }, [state.variantConfigs, variantIndex]);

  const [festivalsData, setFestivalsData] = useState<FestivalsResponse | null>(null);

  useEffect(() => {
    fetch("/api/festivals")
      .then((res) => res.json())
      .then((data: FestivalsResponse) => setFestivalsData(data))
      .catch(() => setFestivalsData(null));
  }, []);

  const sparkles = useMemo(() => {
    return Array.from({ length: 10 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 3,
    }));
  }, []);

  const getCurrentTemplate = useCallback((): FestivalTemplate | null => {
    if (!festivalsData?.festivals) return null;
    const festivalData = festivalsData.festivals[state.activeFestival];
    if (!festivalData?.templates || festivalData.templates.length === 0) return null;
    return festivalData.templates[variantIndex] || null;
  }, [festivalsData, state.activeFestival, variantIndex]);

  useEffect(() => {
    const template = getCurrentTemplate();
    if (template) {
      dispatchRef.current({
        type: "SET_TEMPLATE_SIZE",
        payload: {
          width: template.canvas_dim?.w || 729,
          height: template.canvas_dim?.h || 729,
        },
      });

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = template.image;
      img.onload = () => setTemplateImage(img);
      img.onerror = () => setTemplateImage(null);

      if (template.mapping) {
        fetch(template.mapping)
          .then(res => res.json())
          .then(data => {
            setTemplateMappingConfig(data);
          })
          .catch(() => {
            setTemplateMappingConfig(null);
          });
      } else {
        setTemplateMappingConfig(null);
      }
    } else {
      dispatchRef.current({ type: "SET_TEMPLATE_SIZE", payload: null });
      setTemplateImage(null);
      setTemplateMappingConfig(null);
    }
  }, [state.activeFestival, variantIndex, getCurrentTemplate]);

  useEffect(() => {
    if (state.logoUrl) {
      const img = new Image();
      img.src = state.logoUrl;
      img.onload = () => {
        logoImageRef.current = img;
      };
    } else {
      logoImageRef.current = null;
    }
  }, [state.logoUrl]);

  const getElementPos = useCallback((element: TemplateElement): { x: number; y: number } => {
    const override = state.elementPositions[element.id];
    if (override) {
      return {
        x: Math.round(override.x * canvasWidth),
        y: Math.round(override.y * canvasHeight),
      };
    }
    const { scaleX, scaleY, dx, dy } = templateTransform;
    const origX = element.position?.x ?? element.x ?? 0;
    const origY = element.position?.y ?? element.y ?? 0;
    return {
      x: Math.round(dx + origX * scaleX),
      y: Math.round(dy + origY * scaleY),
    };
  }, [state.elementPositions, templateTransform, canvasWidth, canvasHeight]);

  const getElementScale = useCallback((elementId: string): number => {
    return state.elementScales[elementId] || 1;
  }, [state.elementScales]);

  const measureElementText = useCallback((
    ctx: CanvasRenderingContext2D,
    element: TemplateElement,
    userText: string,
    canvasScale: number
  ): { width: number; height: number } => {
    let text = userText || element.default_text;
    if (element.text_transform === "uppercase") text = text.toUpperCase();
    else if (element.text_transform === "lowercase") text = text.toLowerCase();

    const elScale = getElementScale(element.id);
    const fontWeight = element.font_weight || element.fontWeight ? `${element.font_weight || element.fontWeight} ` : "";
    const baseFontSize = element.font_size || element.fontSize || 0;

    // Use the authoring-space fontSize scaled onto the canvas. Fall back to
    // fluid clamping only when the JSON carries no fontSize.
    let fontSize = baseFontSize;
    if (!(baseFontSize > 0)) {
      if (element.id === "business_name" || element.id === "shop_name" || element.id === "shop") {
        fontSize = Math.max(24, Math.min(42, 3 * (canvasWidth / 100)));
      } else {
        fontSize = Math.max(12, Math.min(18, 1.2 * (canvasWidth / 100)));
      }
    }

    const fontFamily = element.font_family || element.fontFamily || "Arial, sans-serif";
    const fontPx = fontSize * templateTransform.fontScale * elScale * canvasScale;
    ctx.font = `${fontWeight}${fontPx}px ${fontFamily}`;
    ctx.textAlign = element.alignment as CanvasTextAlign;

    const metrics = ctx.measureText(text);
    const actualWidth = metrics.width;
    const actualHeight = (metrics.actualBoundingBoxAscent || fontPx * 0.7)
      + (metrics.actualBoundingBoxDescent || fontPx * 0.3);
    ctx.textAlign = "left";
    return { width: actualWidth, height: actualHeight };
  }, [getElementScale, canvasWidth, templateTransform]);

  const getElementBoxSize = useCallback((
    element: TemplateElement,
    userText: string,
    canvasScale: number
  ): { width: number; height: number } => {
    const override = state.elementSizes[element.id];
    if (override) {
      return {
        width: Math.round(override.width * canvasWidth),
        height: Math.round(override.height * canvasHeight),
      };
    }

    // Authoring-space box scales straight into canvas units so selection,
    // hit-testing, wrapping and the editor stay synced with the JSON.
    const { scaleX, scaleY } = templateTransform;
    const jsonWidth = element.width ?? 0;
    const jsonHeight = element.height ?? 0;
    if (jsonWidth > 0 && jsonHeight > 0) {
      return {
        width: Math.round(jsonWidth * scaleX),
        height: Math.round(jsonHeight * scaleY),
      };
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      const measured = measureElementText(ctx, element, userText, canvasScale);
      return {
        width: Math.round(measured.width / canvasScale + HIT_PADDING * scaleX * 2),
        height: Math.round(measured.height / canvasScale + HIT_PADDING * scaleY * 2),
      };
    }

    return {
      width: element.width ?? 400,
      height: element.height ?? 80,
    };
  }, [state.elementSizes, measureElementText, templateTransform, canvasWidth, canvasHeight]);

  const getElementBoxRect = useCallback((
    element: TemplateElement,
    userText: string,
    canvasScale: number
  ): Rect => {
    const pos = getElementPos(element);
    const box = getElementBoxSize(element, userText, canvasScale);
    return computeBoxFromAnchor(pos, element.alignment, box.width, box.height);
  }, [getElementPos, getElementBoxSize]);

  const getUserText = useCallback((element: TemplateElement): string => {
    if (element.id === "shop_name" || element.id === "business_name" || element.id === "shop") return state.text.shop;
    if (element.id === "contact_number" || element.id === "phone_number" || element.id === "contact" || element.id === "phone") return state.text.countryCode ? `${state.text.countryCode} ${state.text.phone}` : state.text.phone;
    if (element.id === "email") return state.text.email;
    return "";
  }, [state.text]);

  const getProcessedText = useCallback((element: TemplateElement, userText: string): string => {
    let text = userText || element.default_text;
    if (element.text_transform === "uppercase") text = text.toUpperCase();
    else if (element.text_transform === "lowercase") text = text.toLowerCase();
    return text;
  }, []);

  // ---------------------------------------------------------------------------
  // Generic editable-element wiring.
  //
  // To make a future element type fully editable (selection, drag, resize,
  // alignment guides, deselect), just add it to `editableItems` and make sure
  // the three adapters below can measure/position it. Everything else is
  // handled by useElementEditor.
  // ---------------------------------------------------------------------------
  const editableItems = useMemo<EditableItem[]>(() => {
    if (!templateMappingConfig) return [];
    return templateMappingConfig.elements
      .filter((el) => el.type === "text" || el.type === "number")
      .map((el) => ({ id: el.id, type: el.type, alignment: el.alignment }));
  }, [templateMappingConfig]);

  const getRect = useCallback((item: EditableItem, scale: number): Rect | null => {
    const el = templateMappingConfig?.elements.find((e) => e.id === item.id);
    if (!el) return null;
    return getElementBoxRect(el, getUserText(el), scale);
  }, [templateMappingConfig, getElementBoxRect, getUserText]);

  const getBoxSize = useCallback((item: EditableItem, scale: number): { width: number; height: number } | null => {
    const el = templateMappingConfig?.elements.find((e) => e.id === item.id);
    if (!el) return null;
    return getElementBoxSize(el, getUserText(el), scale);
  }, [templateMappingConfig, getElementBoxSize, getUserText]);

  const getAnchor = useCallback((item: EditableItem): { x: number; y: number } => {
    const el = templateMappingConfig?.elements.find((e) => e.id === item.id);
    return el ? getElementPos(el) : { x: 0, y: 0 };
  }, [templateMappingConfig, getElementPos]);

  const editor = useElementEditor({
    canvasRef,
    items: editableItems,
    isActive: state.isEditing && isMain,
    selectedId: state.selectedElementId,
    deletedIds: deletedElementIds,
    getRect,
    getBoxSize,
    getAnchor,
    getScale: (id) => state.elementScales[id] || 1,
    hasSizeOverride: (id) => !!state.elementSizes[id],
    canvasWidth,
    canvasHeight,
    onSelect: (id) => dispatch(id ? { type: "SET_SELECTED_ELEMENT", payload: id } : { type: "CLEAR_SELECTION" }),
    onMove: (id, anchor) => dispatch({ type: "SET_POSITION", payload: { id, x: Math.round(anchor.x), y: Math.round(anchor.y) } }),
    onSize: (id, size) => dispatch({ type: "SET_ELEMENT_SIZE", payload: { id, width: Math.round(size.width), height: Math.round(size.height) } }),
    onScale: (id, scale) => dispatch({ type: "SET_ELEMENT_SCALE", payload: { id, scale } }),
    onDelete: (id) => dispatch({ type: "REMOVE_ELEMENT", payload: { id } }),
  });
  const { guides } = editor;

  const drawTextElement = useCallback((
    ctx: CanvasRenderingContext2D,
    element: TemplateElement,
    userText: string,
    canvasScale: number
  ) => {
    const processedText = getProcessedText(element, userText);

    const elScale = getElementScale(element.id);
    ctx.fillStyle = element.color;
    const fontWeight = element.font_weight || element.fontWeight ? `${element.font_weight || element.fontWeight} ` : "";
    const baseFontSize = element.font_size || element.fontSize || 0;

    // Use the authoring-space fontSize scaled onto the canvas. Fall back to
    // fluid clamping only when the JSON carries no fontSize.
    let clampedFontSize = baseFontSize;
    if (!(baseFontSize > 0)) {
      if (element.id === "business_name" || element.id === "shop_name" || element.id === "shop") {
        clampedFontSize = Math.max(24, Math.min(42, 3 * (canvasWidth / 100)));
      } else {
        clampedFontSize = Math.max(12, Math.min(18, 1.2 * (canvasWidth / 100)));
      }
    }

    const fontSize = clampedFontSize * templateTransform.fontScale * elScale * canvasScale;
    const fontFamily = element.font_family || element.fontFamily || "Arial, sans-serif";
    ctx.font = `${fontWeight}${fontSize}px ${fontFamily}`;
    ctx.textAlign = element.alignment as CanvasTextAlign;

    const rect = getElementBoxRect(element, userText, canvasScale);
    const bx = rect.x * canvasScale;
    const by = rect.y * canvasScale;
    const bw = rect.width * canvasScale;
    const bh = rect.height * canvasScale;

    const maxTextWidth = bw - HIT_PADDING * canvasScale;
    const lines = wrapText(ctx, processedText, Math.max(maxTextWidth, 10));
    const lineHeight = fontSize * LINE_HEIGHT_RATIO;

    const alignment = element.alignment || "left";
    const totalTextHeight = lines.length * lineHeight;
    const startY = by + (bh - totalTextHeight) / 2 + lineHeight * 0.8;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();

    lines.forEach((line, idx) => {
      const lineY = startY + idx * lineHeight;
      let lineX: number;
      if (alignment === "center") {
        lineX = bx + bw / 2;
      } else if (alignment === "right") {
        lineX = bx + bw;
      } else {
        lineX = bx + HIT_PADDING * canvasScale;
      }

      if (alignment === "left") {
        ctx.textAlign = "left";
      } else if (alignment === "center") {
        ctx.textAlign = "center";
      } else {
        ctx.textAlign = "right";
      }

      ctx.fillText(line, lineX, lineY);
    });

    ctx.restore();
    ctx.textAlign = "left";
  }, [getElementBoxRect, getElementScale, getProcessedText, templateTransform]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const scale = width / 729;
    const fallbackScale = width / 300;
    ctx.clearRect(0, 0, width, height);

    if (templateImage) {
      // Contain strategy: fit the entire template inside the canvas so nothing
      // is cropped or stretched. When the canvas ratio matches the template
      // ratio this renders full-bleed with no letterboxing. The same rect is
      // used by templateTransform to scale the mapping JSON onto the image.
      ctx.drawImage(templateImage, imageDrawRect.x, imageDrawRect.y, imageDrawRect.width, imageDrawRect.height);
    } else {
      drawGradientBg(ctx, width, height, state.activeFestival as "diwali");

      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      sparkles.forEach((s) => {
        const x = s.x * width;
        const y = s.y * height;
        ctx.beginPath();
        ctx.arc(x, y, s.r * scale, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (logoImageRef.current) {
      let logoX = 20 * scale, logoY = 20 * scale;
      const logoW = 80 * scale, logoH = 80 * scale;

      if (matrixConfig.logoAnchor === "top-center") {
        logoX = (width - logoW) / 2;
      } else if (matrixConfig.logoAnchor === "bottom-center") {
        logoY = height - logoH - 20 * scale;
        logoX = (width - logoW) / 2;
      } else if (matrixConfig.logoAnchor === "badge") {
        logoX = width - logoW - 20 * scale;
        logoY = 20 * scale;
      }

      ctx.drawImage(logoImageRef.current, logoX, logoY, logoW, logoH);
    }

    if (templateMappingConfig && templateMappingConfig.elements.length > 0) {
      templateMappingConfig.elements.forEach(element => {
        if (deletedElementIds.includes(element.id)) return;
        if (element.type === "text" || element.type === "number") {
          const userText = getUserText(element);
          drawTextElement(ctx, element, userText, 1); // coordinates already mapped to logical canvas units
        } else if (element.type === "logo" && logoImageRef.current) {
          const pos = getElementPos(element);
          const logoW = (element.width || 120) * templateTransform.scaleX;
          const logoH = (element.height || 120) * templateTransform.scaleY;
          ctx.drawImage(logoImageRef.current, pos.x, pos.y, logoW, logoH);
        }
      });
    } else if (matrixConfig.textLayout === "vertical-sidebar") {
      const sidebarWidth = width * 0.35;

      ctx.fillStyle = state.styles.shop.color;
      const shopSize = autoFitText(ctx, state.text.shop, sidebarWidth - 20 * fallbackScale, state.styles.shop.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${shopSize}px Outfit, sans-serif`;
      ctx.fillText(state.text.shop, 20 * fallbackScale, height / 2);

      ctx.fillStyle = state.styles.phone.color;
      const phoneSize = autoFitText(ctx, state.text.phone, sidebarWidth - 20 * fallbackScale, state.styles.phone.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${phoneSize}px Outfit, sans-serif`;
      ctx.fillText(state.text.phone, 20 * fallbackScale, height - 40 * fallbackScale);

      ctx.fillStyle = state.styles.email.color;
      const emailSize = autoFitText(ctx, state.text.email, sidebarWidth - 20 * fallbackScale, state.styles.email.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${emailSize}px Outfit, sans-serif`;
      ctx.fillText(state.text.email, 20 * fallbackScale, height - 10 * fallbackScale);
    } else if (matrixConfig.textLayout === "centered-stack") {
      ctx.textAlign = "center";

      ctx.fillStyle = state.styles.shop.color;
      const shopSize = autoFitText(ctx, state.text.shop, width - 40 * fallbackScale, state.styles.shop.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${shopSize}px Outfit, sans-serif`;
      ctx.fillText(state.text.shop, width / 2, height / 2 - 40 * fallbackScale);

      ctx.fillStyle = state.styles.phone.color;
      const phoneSize = autoFitText(ctx, state.text.phone, width - 40 * fallbackScale, state.styles.phone.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${phoneSize}px Outfit, sans-serif`;
      ctx.fillText(state.text.phone, width / 2, height / 2 + 20 * fallbackScale);

      ctx.fillStyle = state.styles.email.color;
      const emailSize = autoFitText(ctx, state.text.email, width - 40 * fallbackScale, state.styles.email.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${emailSize}px Outfit, sans-serif`;
      ctx.fillText(state.text.email, width / 2, height / 2 + 80 * fallbackScale);

      ctx.textAlign = "left";
    } else if (matrixConfig.textLayout === "split-header-footer") {
      ctx.fillStyle = state.styles.shop.color;
      const shopSize = autoFitText(ctx, state.text.shop, width - 40 * fallbackScale, state.styles.shop.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${shopSize}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(state.text.shop, width / 2, height / 2 + 20 * fallbackScale);
      ctx.textAlign = "left";

      ctx.fillStyle = state.styles.phone.color;
      const phoneSize = autoFitText(ctx, state.text.phone, width - 40 * fallbackScale, state.styles.phone.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${phoneSize}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(state.text.phone, width / 2, height - 40 * fallbackScale);
      ctx.textAlign = "left";

      ctx.fillStyle = state.styles.email.color;
      const emailSize = autoFitText(ctx, state.text.email, width - 40 * fallbackScale, state.styles.email.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${emailSize}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(state.text.email, width / 2, height - 10 * fallbackScale);
      ctx.textAlign = "left";
    } else if (matrixConfig.textLayout === "floating-minimalist") {
      drawRoundedRect(ctx, 20 * fallbackScale, 20 * fallbackScale, width - 40 * fallbackScale, height - 40 * fallbackScale, 20 * fallbackScale, "rgba(0, 0, 0, 0.3)");

      ctx.fillStyle = state.styles.shop.color;
      const shopSize = autoFitText(ctx, state.text.shop, width - 80 * fallbackScale, state.styles.shop.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${shopSize}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(state.text.shop, width / 2, height / 2 - 20 * fallbackScale);
      ctx.textAlign = "left";

      ctx.fillStyle = state.styles.phone.color;
      const phoneSize = autoFitText(ctx, state.text.phone, width - 80 * fallbackScale, state.styles.phone.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${phoneSize}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(state.text.phone, width / 2, height / 2 + 30 * fallbackScale);
      ctx.textAlign = "left";

      ctx.fillStyle = state.styles.email.color;
      const emailSize = autoFitText(ctx, state.text.email, width - 80 * fallbackScale, state.styles.email.fontSize * fallbackScale, "Outfit, sans-serif");
      ctx.font = `${emailSize}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(state.text.email, width / 2, height - 50 * fallbackScale);
      ctx.textAlign = "left";
    }
    if (state.isEditing && isMain) {
      if (guides.v !== null || guides.h !== null) {
        ctx.save();
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        if (guides.v !== null) {
          ctx.beginPath();
          ctx.moveTo(guides.v, 0);
          ctx.lineTo(guides.v, height);
          ctx.stroke();
        }
        if (guides.h !== null) {
          ctx.beginPath();
          ctx.moveTo(0, guides.h);
          ctx.lineTo(width, guides.h);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }, [state, matrixConfig, sparkles, templateImage, imageDrawRect, templateTransform, templateMappingConfig, drawTextElement, getElementPos, getUserText, isMain, guides, deletedElementIds, canvasWidth, canvasHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    draw(ctx, canvas.width, canvas.height);
  }, [draw]);

  const canvasClassName = state.isEditing && isMain
    ? "w-full rounded-lg shadow-lg cursor-crosshair ring-2 ring-blue-400"
    : "w-full rounded-lg shadow-lg cursor-pointer hover:ring-2 hover:ring-saffron";

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        id={isMain ? "main-canvas" : undefined}
        className={canvasClassName}
        onMouseDown={editor.handlers.onMouseDown}
        onMouseMove={editor.handlers.onMouseMove}
        onMouseLeave={editor.handlers.onMouseLeave}
        onTouchStart={editor.handlers.onTouchStart}
      />
      {state.isEditing && isMain && (
        <div className="absolute top-2 left-2 bg-blue-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium pointer-events-none">
          Drag to reposition · Drag corners to resize
        </div>
      )}

      {state.isEditing && isMain && editor.overlay.item && editor.overlay.rect && (
        <SelectionOverlay
          itemId={editor.overlay.item.id}
          rect={editor.overlay.rect}
          isResizing={editor.overlay.isResizing}
          resizable={editor.overlay.item.resizable}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      )}
    </div>
  );
};

export default CanvasRenderer;
