/** JSON-declared canvas size (authoring space of a mapping/config file). */
export interface JsonCanvasSize {
  width: number;
  height: number;
}

/** The rect (in canvas units) that a template image actually occupies. */
export interface ImageDrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Transform from a mapping JSON's authoring space to the live canvas, based on
 * the rect the template image is drawn into (contain strategy).
 *
 * Positions/sizes scale per axis by the drawn-image-to-JSON ratio, and fonts
 * use the average of both axes (mirrors the frame-text-editor `rescaleElements`
 * `sf = (sx + sy) / 2`). If a side of the JSON canvas is invalid the ratio falls
 * back to 1 so a malformed file degrades to identity instead of exploding.
 */
export function getTemplateTransform(
  jsonSize: JsonCanvasSize | null | undefined,
  imageRect: ImageDrawRect
): { scaleX: number; scaleY: number; fontScale: number; dx: number; dy: number } {
  const jw = jsonSize && jsonSize.width > 0 ? jsonSize.width : imageRect.width;
  const jh = jsonSize && jsonSize.height > 0 ? jsonSize.height : imageRect.height;
  const scaleX = imageRect.width / jw;
  const scaleY = imageRect.height / jh;
  return {
    scaleX,
    scaleY,
    fontScale: (scaleX + scaleY) / 2,
    dx: imageRect.x,
    dy: imageRect.y,
  };
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

export function autoFitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  initialFontSize: number,
  fontFamily: string
): number {
  let fontSize = initialFontSize;
  ctx.font = `${fontSize}px ${fontFamily}`;

  while (ctx.measureText(text).width > maxWidth && fontSize > 8) {
    fontSize -= 2;
    ctx.font = `${fontSize}px ${fontFamily}`;
  }

  return fontSize;
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle?: string
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
}

export function drawGradientBg(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  festival: "diwali" | "holi" | "dussehra" | "navratri" | "rama_navami" | "finance" | "it-tech" | "marketing" | "sales" | "dj" | "real-estate" | "fashion"
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);

  switch (festival) {
    case "diwali":
      gradient.addColorStop(0, "#0F172A");
      gradient.addColorStop(0.5, "#1E1B4B");
      gradient.addColorStop(1, "#0F172A");
      break;
    case "holi":
      gradient.addColorStop(0, "#F472B6");
      gradient.addColorStop(0.5, "#7C3AED");
      gradient.addColorStop(1, "#06B6D4");
      break;
    case "dussehra":
      gradient.addColorStop(0, "#7f1d1d");
      gradient.addColorStop(0.5, "#9a3412");
      gradient.addColorStop(1, "#450a0a");
      break;
    case "navratri":
      gradient.addColorStop(0, "#4c1d95");
      gradient.addColorStop(0.5, "#db2777");
      gradient.addColorStop(1, "#be185d");
      break;
    case "rama_navami":
      gradient.addColorStop(0, "#ea580c");
      gradient.addColorStop(0.5, "#f59e0b");
      gradient.addColorStop(1, "#fbbf24");
      break;
    case "finance":
      gradient.addColorStop(0, "#059669");
      gradient.addColorStop(0.5, "#10b981");
      gradient.addColorStop(1, "#34d399");
      break;
    case "it-tech":
      gradient.addColorStop(0, "#1e40af");
      gradient.addColorStop(0.5, "#3b82f6");
      gradient.addColorStop(1, "#60a5fa");
      break;
    case "marketing":
      gradient.addColorStop(0, "#db2777");
      gradient.addColorStop(0.5, "#f472b6");
      gradient.addColorStop(1, "#f9a8d4");
      break;
    case "sales":
      gradient.addColorStop(0, "#dc2626");
      gradient.addColorStop(0.5, "#f97316");
      gradient.addColorStop(1, "#fbbf24");
      break;
    case "dj":
      gradient.addColorStop(0, "#6b21a8");
      gradient.addColorStop(0.5, "#c026d3");
      gradient.addColorStop(1, "#db2777");
      break;
    case "real-estate":
      gradient.addColorStop(0, "#b45309");
      gradient.addColorStop(0.5, "#ea580c");
      gradient.addColorStop(1, "#f59e0b");
      break;
    case "fashion":
      gradient.addColorStop(0, "#be123c");
      gradient.addColorStop(0.5, "#ec4899");
      gradient.addColorStop(1, "#d946ef");
      break;
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}