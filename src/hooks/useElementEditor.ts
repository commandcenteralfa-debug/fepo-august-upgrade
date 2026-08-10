"use client";

/**
 * Generic element interaction engine for the canvas editor.
 *
 * Everything an "editable element" needs — selection, mouse/touch dragging,
 * 8-handle resizing, pinch zoom, smart alignment guides with snapping, and
 * keyboard shortcuts (Delete / Esc / arrows) — lives here, driven entirely by
 * bounding-box adapters. The hook never cares about what an element *is*
 * (text, shape, image, sticker...); it only needs each element's id and a way
 * to compute its box.
 *
 * To make a new element type fully editable:
 *   1. Add it to the `items` array passed in (optionally set `resizable: false`).
 *   2. Provide `getRect` / `getBoxSize` / `getAnchor` adapters that know how to
 *      measure that type.
 *   3. Map `onMove` / `onSize` / `onScale` / `onSelect` / `onDelete` to your
 *      state layer.
 * That's it — selection, drag, resize, guides, deselect, and shortcuts follow
 * automatically. Element-specific *rendering* stays in the caller.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  MIN_BOX_HEIGHT,
  MIN_BOX_WIDTH,
  RESIZE_HANDLE_SIZE,
  SNAP_THRESHOLD,
  getResizeCursor,
  computeAnchorFromBox,
  computeAspectResizedBox,
  computeBoxFromAnchor,
  computeResizedBox,
  type Rect,
  type ResizeCorner,
} from "@/lib/resizeUtils";

/** A selectable/editable object on the canvas. */
export interface EditableItem {
  id: string;
  type: string;
  alignment?: string;
  /** Set to false to hide the resize handles for this item. Defaults to true. */
  resizable?: boolean;
  /**
   * Preserve the item's aspect ratio while resizing (width/height stay
   * proportional). Defaults to false.
   */
  lockAspectRatio?: boolean;
  /**
   * How the anchor's y relates to the box. "center" (default) treats the
   * anchor y as the box's vertical center (text boxes). "top" treats it as the
   * box's top edge (images/logos drawn at their top-left corner).
   */
  anchorVertical?: "top" | "center";
}

export interface ElementEditorCallbacks {
  onSelect: (id: string | null) => void;
  onMove: (id: string, anchor: { x: number; y: number }) => void;
  onSize: (id: string, size: { width: number; height: number }) => void;
  onScale: (id: string, scale: number) => void;
  onDelete: (id: string) => void;
}

export interface UseElementEditorArgs extends ElementEditorCallbacks {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  items: EditableItem[];
  /** True while the editor is interactive on this canvas (editing mode + main canvas). */
  isActive: boolean;
  selectedId: string | null;
  /** Ids hidden by the user (Delete key). */
  deletedIds: string[];
  /** Full bounding box of an item in template units at the given canvas scale. */
  getRect: (item: EditableItem, scale: number) => Rect | null;
  /** Width/height of an item in template units (used for clamping & snapping). */
  getBoxSize: (item: EditableItem, scale: number) => { width: number; height: number } | null;
  /** Current anchor (x/y) of an item in template units. */
  getAnchor: (item: EditableItem) => { x: number; y: number };
  /** Current scale factor of an item (1 when unscaled). Used by pinch zoom. */
  getScale?: (id: string) => number;
  /** Whether an item has a manually-set box size (pinch then scales it too). */
  hasSizeOverride?: (id: string) => boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export interface ElementEditorHandle {
  /** Active alignment guides (template units); render these on the canvas. */
  guides: { v: number | null; h: number | null };
  /** Data for the selection-box overlay. */
  overlay: { item: EditableItem | null; rect: Rect | null; isResizing: boolean };
  /** Hit-test canvas pixel coordinates against items + the selected item's handles. */
  hitTest: (x: number, y: number, displayWidth: number) => { itemId: string | null; handle: ResizeCorner | null };
  /** Handlers to attach to the <canvas> element. */
  handlers: {
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  };
}

interface AdapterSnapshot {
  items: EditableItem[];
  isActive: boolean;
  selectedId: string | null;
  deletedIds: string[];
  getRect: (item: EditableItem, scale: number) => Rect | null;
  getBoxSize: (item: EditableItem, scale: number) => { width: number; height: number } | null;
  getAnchor: (item: EditableItem) => { x: number; y: number };
  getScale: (id: string) => number;
  hasSizeOverride: (id: string) => boolean;
  canvasWidth: number;
  canvasHeight: number;
  callbacks: ElementEditorCallbacks;
}

export function useElementEditor(args: UseElementEditorArgs): ElementEditorHandle {
  const {
    canvasRef,
    items,
    isActive,
    selectedId,
    deletedIds,
    getRect,
    getBoxSize,
    getAnchor,
    getScale = () => 1,
    hasSizeOverride = () => false,
    canvasWidth,
    canvasHeight,
    onSelect,
    onMove,
    onSize,
    onScale,
    onDelete,
  } = args;

  // Latest props/adapters, readable from stable effect closures without
  // re-subscribing listeners on every render.
  const adaptersRef = useRef<AdapterSnapshot>({
    items,
    isActive,
    selectedId,
    deletedIds,
    getRect,
    getBoxSize,
    getAnchor,
    getScale,
    hasSizeOverride,
    canvasWidth,
    canvasHeight,
    callbacks: { onSelect, onMove, onSize, onScale, onDelete },
  });
  adaptersRef.current = {
    items,
    isActive,
    selectedId,
    deletedIds,
    getRect,
    getBoxSize,
    getAnchor,
    getScale,
    hasSizeOverride,
    canvasWidth,
    canvasHeight,
    callbacks: { onSelect, onMove, onSize, onScale, onDelete },
  };

  const dragRef = useRef<{ itemId: string; offsetX: number; offsetY: number } | null>(null);
  const resizeRef = useRef<{
    itemId: string;
    corner: ResizeCorner;
    startMouseX: number;
    startMouseY: number;
    startBoxX: number;
    startBoxY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const pinchRef = useRef<{
    itemId: string;
    initialDistance: number;
    initialScale: number;
    startPos: { x: number; y: number };
    startFocalX: number;
    startFocalY: number;
    startWidth: number;
    startHeight: number;
    hadSizeOverride: boolean;
  } | null>(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });

  const getMousePos = useCallback((e: MouseEvent | React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [canvasRef]);

  const getTouchPos = useCallback((e: Touch | React.Touch): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [canvasRef]);

  const hitTest = useCallback((
    mouseX: number,
    mouseY: number,
    displayWidth: number
  ): { itemId: string | null; handle: ResizeCorner | null } => {
    const { items, isActive, selectedId, deletedIds, getRect, canvasWidth } = adaptersRef.current;
    if (!isActive) return { itemId: null, handle: null };
    const canvasScale = displayWidth / canvasWidth;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (deletedIds.includes(item.id)) continue;
      const rect = getRect(item, canvasScale);
      if (!rect) continue;
      const rx = rect.x * canvasScale;
      const ry = rect.y * canvasScale;
      const rw = rect.width * canvasScale;
      const rh = rect.height * canvasScale;
      const hs = RESIZE_HANDLE_SIZE * canvasScale;

      // Resize handles only exist for the currently selected item.
      if (selectedId === item.id && item.resizable !== false) {
        const handlePoints: { corner: ResizeCorner; cx: number; cy: number }[] = [
          { corner: "tl", cx: rx, cy: ry },
          { corner: "tc", cx: rx + rw / 2, cy: ry },
          { corner: "tr", cx: rx + rw, cy: ry },
          { corner: "ml", cx: rx, cy: ry + rh / 2 },
          { corner: "mr", cx: rx + rw, cy: ry + rh / 2 },
          { corner: "bl", cx: rx, cy: ry + rh },
          { corner: "bc", cx: rx + rw / 2, cy: ry + rh },
          { corner: "br", cx: rx + rw, cy: ry + rh },
        ];

        for (const c of handlePoints) {
          if (
            mouseX >= c.cx - hs &&
            mouseX <= c.cx + hs &&
            mouseY >= c.cy - hs &&
            mouseY <= c.cy + hs
          ) {
            return { itemId: item.id, handle: c.corner };
          }
        }
      }

      if (mouseX >= rx && mouseX <= rx + rw && mouseY >= ry && mouseY <= ry + rh) {
        return { itemId: item.id, handle: null };
      }
    }
    return { itemId: null, handle: null };
  }, []);

  /**
   * Find the nearest alignment target for each axis within SNAP_THRESHOLD and
   * return the snapped anchor plus the guide positions to render.
   */
  const computeSnapGuides = useCallback((
    item: EditableItem,
    anchorX: number,
    anchorY: number
  ): { x: number; y: number; v: number | null; h: number | null } => {
    const { items, deletedIds, getBoxSize, getAnchor, canvasWidth, canvasHeight } = adaptersRef.current;
    const size = getBoxSize(item, 1);
    if (!size) return { x: anchorX, y: anchorY, v: null, h: null };
    const rect = item.anchorVertical === "top"
      ? { x: anchorX, y: anchorY, width: size.width, height: size.height }
      : computeBoxFromAnchor({ x: anchorX, y: anchorY }, item.alignment, size.width, size.height);

    const xCandidates = [rect.x, rect.x + rect.width / 2, rect.x + rect.width];
    const yCandidates = [rect.y, rect.y + rect.height / 2, rect.y + rect.height];
    const xTargets = [0, canvasWidth / 2, canvasWidth];
    const yTargets = [0, canvasHeight / 2, canvasHeight];

    items.forEach((el) => {
      if (el.id === item.id || deletedIds.includes(el.id)) return;
      const elSize = getBoxSize(el, 1);
      if (!elSize) return;
      const elAnchor = getAnchor(el);
      const elRect = el.anchorVertical === "top"
        ? { x: elAnchor.x, y: elAnchor.y, width: elSize.width, height: elSize.height }
        : computeBoxFromAnchor(elAnchor, el.alignment, elSize.width, elSize.height);
      xTargets.push(elRect.x, elRect.x + elRect.width / 2, elRect.x + elRect.width);
      yTargets.push(elRect.y, elRect.y + elRect.height / 2, elRect.y + elRect.height);
    });

    const findSnap = (candidates: number[], targets: number[]) => {
      let bestDelta = 0;
      let bestTarget: number | null = null;
      for (const c of candidates) {
        for (const t of targets) {
          const d = t - c;
          if (Math.abs(d) < SNAP_THRESHOLD && (bestTarget === null || Math.abs(d) < Math.abs(bestDelta))) {
            bestDelta = d;
            bestTarget = t;
          }
        }
      }
      return { delta: bestTarget === null ? 0 : bestDelta, target: bestTarget };
    };

    const xs = findSnap(xCandidates, xTargets);
    const ys = findSnap(yCandidates, yTargets);
    return {
      x: anchorX + xs.delta,
      y: anchorY + ys.delta,
      v: xs.target,
      h: ys.target,
    };
  }, []);

  /** Clamp an anchor so the item's box stays inside the canvas. */
  const clampAnchor = useCallback((
    item: EditableItem,
    x: number,
    y: number
  ): { x: number; y: number } => {
    const { getBoxSize, canvasWidth, canvasHeight } = adaptersRef.current;
    const size = getBoxSize(item, 1);
    if (!size) return { x: Math.max(0, Math.min(canvasWidth, x)), y: Math.max(0, Math.min(canvasHeight, y)) };
    const bw = size.width;
    const bh = size.height;
    const alignment = (item.alignment || "left") as CanvasTextAlign;
    let clampedX: number;
    if (alignment === "center") {
      clampedX = Math.max(bw / 2, Math.min(canvasWidth - bw / 2, x));
    } else if (alignment === "right") {
      clampedX = Math.max(bw, Math.min(canvasWidth, x));
    } else {
      clampedX = Math.max(0, Math.min(canvasWidth - bw, x));
    }
    const clampedY = item.anchorVertical === "top"
      ? Math.max(0, Math.min(canvasHeight - bh, y))
      : Math.max(bh / 2, Math.min(canvasHeight - bh / 2, y));
    return { x: clampedX, y: clampedY };
  }, []);

  /** Begin a pointer gesture: select on mousedown, then start drag or resize. */
  const startDrag = useCallback((pos: { x: number; y: number }) => {
    const { isActive, selectedId, getRect, callbacks, canvasWidth: cW, canvasHeight: cH } = adaptersRef.current;
    const canvas = canvasRef.current;
    if (!isActive || !canvas) return;

    const hit = hitTest(pos.x, pos.y, canvas.width);

    if (selectedId !== hit.itemId) {
      callbacks.onSelect(hit.itemId);
    }

    if (hit.itemId && hit.handle) {
      const item = adaptersRef.current.items.find((i) => i.id === hit.itemId);
      if (item) {
        const rect = getRect(item, canvas.width / cW);
        if (rect) {
          resizeRef.current = {
            itemId: hit.itemId,
            corner: hit.handle,
            startMouseX: pos.x,
            startMouseY: pos.y,
            startBoxX: rect.x,
            startBoxY: rect.y,
            startWidth: rect.width,
            startHeight: rect.height,
          };
        }
        canvas.style.cursor = getResizeCursor(hit.handle);
      }
      return;
    }

    if (hit.itemId) {
      const item = adaptersRef.current.items.find((i) => i.id === hit.itemId);
      if (item) {
        const elPos = adaptersRef.current.getAnchor(item);
        dragRef.current = {
          itemId: hit.itemId,
          offsetX: pos.x - elPos.x * (canvas.width / cW),
          offsetY: pos.y - elPos.y * (canvas.height / cH),
        };
        canvas.style.cursor = "grabbing";
      }
    }
  }, [canvasRef, hitTest]);

  // Window-level move/up listeners active only while editing. They read the
  // latest adapters through adaptersRef, so they never go stale.
  useEffect(() => {
    if (!isActive) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const { callbacks, canvasWidth: cW, canvasHeight: cH } = adaptersRef.current;

      if (resizeRef.current) {
        const r = resizeRef.current;
        const pos = getMousePos(e);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const sX = canvas.width / cW;
        const sY = canvas.height / cH;
        const dx = (pos.x - r.startMouseX) / sX;
        const dy = (pos.y - r.startMouseY) / sY;

        const item = adaptersRef.current.items.find((i) => i.id === r.itemId);
        const box = item?.lockAspectRatio && r.startWidth > 0 && r.startHeight > 0
          ? computeAspectResizedBox(r, dx, dy, cW, cH, r.startWidth / r.startHeight)
          : computeResizedBox(r, dx, dy, cW, cH);
        if (item) {
          const anchor = computeAnchorFromBox(item, box.boxX, box.boxY, box.width, box.height);
          callbacks.onMove(r.itemId, { x: Math.round(anchor.x), y: Math.round(anchor.y) });
        }
        callbacks.onSize(r.itemId, { width: Math.round(box.width), height: Math.round(box.height) });
        return;
      }

      const dragData = dragRef.current;
      if (!dragData) return;
      const pos = getMousePos(e);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scaleX = canvas.width / cW;
      const scaleY = canvas.height / cH;
      const rawX = (pos.x - dragData.offsetX) / scaleX;
      const rawY = (pos.y - dragData.offsetY) / scaleY;
      const item = adaptersRef.current.items.find((i) => i.id === dragData.itemId);
      const clamped = item ? clampAnchor(item, rawX, rawY) : { x: Math.max(0, Math.min(cW, rawX)), y: Math.max(0, Math.min(cH, rawY)) };

      let finalX = clamped.x;
      let finalY = clamped.y;
      let snapV: number | null = null;
      let snapH: number | null = null;
      if (item) {
        const snapped = computeSnapGuides(item, clamped.x, clamped.y);
        const snappedClamped = clampAnchor(item, snapped.x, snapped.y);
        finalX = snappedClamped.x;
        finalY = snappedClamped.y;
        snapV = snapped.v;
        snapH = snapped.h;
      }
      setGuides({ v: snapV, h: snapH });
      callbacks.onMove(dragData.itemId, { x: Math.round(finalX), y: Math.round(finalY) });
    };

    const handleWindowMouseUp = () => {
      resizeRef.current = null;
      dragRef.current = null;
      setGuides({ v: null, h: null });
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = "default";
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      const { callbacks, canvasWidth: cW, canvasHeight: cH } = adaptersRef.current;

      if (resizeRef.current) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        const pos = getTouchPos(touch);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const r = resizeRef.current;
        const sX = canvas.width / cW;
        const sY = canvas.height / cH;
        const dx = (pos.x - r.startMouseX) / sX;
        const dy = (pos.y - r.startMouseY) / sY;

        const item = adaptersRef.current.items.find((i) => i.id === r.itemId);
        const box = item?.lockAspectRatio && r.startWidth > 0 && r.startHeight > 0
          ? computeAspectResizedBox(r, dx, dy, cW, cH, r.startWidth / r.startHeight)
          : computeResizedBox(r, dx, dy, cW, cH);
        if (item) {
          const anchor = computeAnchorFromBox(item, box.boxX, box.boxY, box.width, box.height);
          callbacks.onMove(r.itemId, { x: Math.round(anchor.x), y: Math.round(anchor.y) });
        }
        callbacks.onSize(r.itemId, { width: Math.round(box.width), height: Math.round(box.height) });
        return;
      }

      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        if (!t0 || !t1) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const toCanvasPos = (t: Touch) => ({
          x: (t.clientX - rect.left) * (canvas.width / rect.width),
          y: (t.clientY - rect.top) * (canvas.height / rect.height),
        });
        const p0 = toCanvasPos(t0);
        const p1 = toCanvasPos(t1);
        const dist = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
        const p = pinchRef.current;
        const ratio = dist / p.initialDistance;
        const newScale = Math.max(0.3, Math.min(5, p.initialScale * ratio));
        // Keep the element pinned under the fingers: recompute its anchor by
        // scaling it around the pinch focal point (same principle as the corner
        // handles pinning the opposite corner during resize).
        const scaleFactor = newScale / p.initialScale;
        const newX = p.startFocalX + (p.startPos.x - p.startFocalX) * scaleFactor;
        const newY = p.startFocalY + (p.startPos.y - p.startFocalY) * scaleFactor;
        callbacks.onScale(p.itemId, Math.round(newScale * 100) / 100);
        // Scale the box size too when the element has a manually-set size
        // override, so the larger text never overflows it. Auto-measured boxes
        // (no override) already grow with the font, and locking them here would
        // break auto-fit for future text edits.
        if (p.hadSizeOverride) {
          const newW = Math.max(MIN_BOX_WIDTH, Math.min(cW, p.startWidth * scaleFactor));
          const newH = Math.max(MIN_BOX_HEIGHT, Math.min(cH, p.startHeight * scaleFactor));
          callbacks.onSize(p.itemId, { width: Math.round(newW), height: Math.round(newH) });
        }
        callbacks.onMove(p.itemId, {
          x: Math.round(Math.max(0, Math.min(cW, newX))),
          y: Math.round(Math.max(0, Math.min(cH, newY))),
        });
        return;
      }

      const touchDragData = dragRef.current;
      if (!touchDragData) return;
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const pos = getTouchPos(touch);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scaleX = canvas.width / cW;
      const scaleY = canvas.height / cH;
      const rawX = (pos.x - touchDragData.offsetX) / scaleX;
      const rawY = (pos.y - touchDragData.offsetY) / scaleY;
      const item = adaptersRef.current.items.find((i) => i.id === touchDragData.itemId);
      const clamped = item ? clampAnchor(item, rawX, rawY) : { x: Math.max(0, Math.min(cW, rawX)), y: Math.max(0, Math.min(cH, rawY)) };

      let finalX = clamped.x;
      let finalY = clamped.y;
      let snapV: number | null = null;
      let snapH: number | null = null;
      if (item) {
        const snapped = computeSnapGuides(item, clamped.x, clamped.y);
        const snappedClamped = clampAnchor(item, snapped.x, snapped.y);
        finalX = snappedClamped.x;
        finalY = snappedClamped.y;
        snapV = snapped.v;
        snapH = snapped.h;
      }
      setGuides({ v: snapV, h: snapH });
      callbacks.onMove(touchDragData.itemId, { x: Math.round(finalX), y: Math.round(finalY) });
    };

    const handleWindowTouchEnd = () => {
      resizeRef.current = null;
      dragRef.current = null;
      pinchRef.current = null;
      setGuides({ v: null, h: null });
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = "default";
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("touchmove", handleWindowTouchMove, { passive: false });
    window.addEventListener("touchend", handleWindowTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowTouchEnd);
    };
  }, [isActive, getMousePos, getTouchPos, canvasRef, clampAnchor, computeSnapGuides]);

  // Keyboard shortcuts (Delete / Backspace, Esc, arrows, Shift+arrows).
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      const { selectedId, items, deletedIds, getAnchor, callbacks, canvasWidth: cW, canvasHeight: cH } = adaptersRef.current;
      if (!selectedId) return;

      // Self-heal a stale selection (e.g. after a festival/template switch).
      if (!items.some((i) => i.id === selectedId)) {
        callbacks.onSelect(null);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        callbacks.onDelete(selectedId);
        return;
      }

      if (e.key === "Escape") {
        callbacks.onSelect(null);
        return;
      }

      const dir = e.key.startsWith("Arrow") ? e.key.slice(5) : null;
      if (!dir) return;
      e.preventDefault();

      const item = items.find((i) => i.id === selectedId);
      if (!item || deletedIds.includes(item.id)) return;

      const step = e.shiftKey ? 10 : 1;
      const dx = dir === "Left" ? -step : dir === "Right" ? step : 0;
      const dy = dir === "Up" ? -step : dir === "Down" ? step : 0;
      const pos = getAnchor(item);
      callbacks.onMove(selectedId, {
        x: Math.round(Math.max(0, Math.min(cW, pos.x + dx))),
        y: Math.round(Math.max(0, Math.min(cH, pos.y + dy))),
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    startDrag(getMousePos(e));
  }, [getMousePos, startDrag]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { isActive } = adaptersRef.current;
    if (!isActive) return;
    if (dragRef.current || resizeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getMousePos(e);
    const hit = hitTest(pos.x, pos.y, canvas.width);

    if (hit.handle) {
      canvas.style.cursor = getResizeCursor(hit.handle);
    } else if (hit.itemId) {
      canvas.style.cursor = "grab";
    } else {
      canvas.style.cursor = "default";
    }
  }, [getMousePos, hitTest, canvasRef]);

  const handleMouseLeave = useCallback(() => {
    if (dragRef.current || resizeRef.current) return;
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = "default";
  }, [canvasRef]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const { isActive } = adaptersRef.current;
    if (!isActive) return;
    e.preventDefault();

    if (e.touches.length === 2) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      if (!t0 || !t1) return;
      const toCanvasPos = (t: React.Touch) => ({
        x: (t.clientX - rect.left) * (canvas.width / rect.width),
        y: (t.clientY - rect.top) * (canvas.height / rect.height),
      });
      const p0 = toCanvasPos(t0);
      const p1 = toCanvasPos(t1);
      const dist = Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      const hit = hitTest(midX, midY, canvas.width);
      if (hit.itemId && !hit.handle) {
        const item = adaptersRef.current.items.find((i) => i.id === hit.itemId);
        if (item) {
          const { getAnchor, getBoxSize, getScale, hasSizeOverride, canvasWidth: cW, canvasHeight: cH } = adaptersRef.current;
          const elPos = getAnchor(item);
          const canvasScale = canvas.width / cW;
          const startBox = getBoxSize(item, canvasScale);
          pinchRef.current = {
            itemId: hit.itemId,
            initialDistance: dist,
            initialScale: getScale(hit.itemId),
            startPos: elPos,
            startFocalX: midX / canvasScale,
            startFocalY: midY / (canvas.height / cH),
            startWidth: startBox?.width ?? 0,
            startHeight: startBox?.height ?? 0,
            hadSizeOverride: hasSizeOverride(item.id),
          };
          dragRef.current = null;
        }
      }
      return;
    }

    const touch = e.touches[0];
    if (touch) startDrag(getTouchPos(touch));
  }, [hitTest, startDrag, getTouchPos]);

  // Overlay data (recomputed on every render so it stays in sync with state).
  const selectedItem = selectedId && !deletedIds.includes(selectedId)
    ? items.find((i) => i.id === selectedId) ?? null
    : null;
  const selectedRect = selectedItem ? getRect(selectedItem, 1) : null;

  return {
    guides,
    overlay: {
      item: selectedItem,
      rect: selectedRect,
      // Size label shows while resizing OR pinch-zooming the selected item.
      isResizing: resizeRef.current?.itemId === selectedId || pinchRef.current?.itemId === selectedId,
    },
    hitTest,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleCanvasMouseMove,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
    },
  };
}
