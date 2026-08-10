/**
 * Pure geometry helpers for resizing canvas elements.
 * Kept free of React/component dependencies so they can be unit-tested.
 */

export type ResizeCorner = "tl" | "tc" | "tr" | "ml" | "mr" | "bl" | "bc" | "br";

export const MIN_BOX_WIDTH = 80;
export const MIN_BOX_HEIGHT = 30;
export const CANVAS_SIZE = 729;
export const RESIZE_HANDLE_SIZE = 12;

/** Snap distance (template units) for smart alignment guides. */
export const SNAP_THRESHOLD = 6;

/** Axis-aligned bounding box in template units. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The 8 resize handles, with their position inside the selection box (in %)
 * and the CSS cursor for each direction. Pure data so the canvas hit-testing,
 * the HTML overlay, and tests all share the same source of truth.
 */
export const RESIZE_HANDLES: { id: ResizeCorner; left: number; top: number; cursor: string }[] = [
  { id: "tl", left: 0, top: 0, cursor: "nwse-resize" },
  { id: "tc", left: 50, top: 0, cursor: "ns-resize" },
  { id: "tr", left: 100, top: 0, cursor: "nesw-resize" },
  { id: "ml", left: 0, top: 50, cursor: "ew-resize" },
  { id: "mr", left: 100, top: 50, cursor: "ew-resize" },
  { id: "bl", left: 0, top: 100, cursor: "nesw-resize" },
  { id: "bc", left: 50, top: 100, cursor: "ns-resize" },
  { id: "br", left: 100, top: 100, cursor: "nwse-resize" },
];

/** Map a resize handle to its CSS cursor. */
export function getResizeCursor(handle: ResizeCorner): string {
  const h = RESIZE_HANDLES.find((x) => x.id === handle);
  return h ? h.cursor : "default";
}

export interface ResizeSnapshot {
  corner: ResizeCorner;
  startBoxX: number;
  startBoxY: number;
  startWidth: number;
  startHeight: number;
}

/**
 * Compute the resized box (position + size, in template units) from the drag
 * delta of a corner resize gesture. The corner opposite to the dragged one is
 * kept as fixed as possible, and the result is clamped to minimum sizes and
 * the canvas bounds.
 */
export function computeResizedBox(
  r: ResizeSnapshot,
  dx: number,
  dy: number,
  canvasWidth: number = 729,
  canvasHeight: number = 729
): { boxX: number; boxY: number; width: number; height: number } {
  let newW = r.startWidth;
  let newH = r.startHeight;
  let newBoxX = r.startBoxX;
  let newBoxY = r.startBoxY;

  switch (r.corner) {
    case "tl":
      newW = Math.max(MIN_BOX_WIDTH, r.startWidth - dx);
      newH = Math.max(MIN_BOX_HEIGHT, r.startHeight - dy);
      newBoxX = r.startBoxX + (r.startWidth - newW);
      newBoxY = r.startBoxY + (r.startHeight - newH);
      break;
    case "tc":
      newH = Math.max(MIN_BOX_HEIGHT, r.startHeight - dy);
      newBoxY = r.startBoxY + (r.startHeight - newH);
      break;
    case "tr":
      newW = Math.max(MIN_BOX_WIDTH, r.startWidth + dx);
      newH = Math.max(MIN_BOX_HEIGHT, r.startHeight - dy);
      newBoxY = r.startBoxY + (r.startHeight - newH);
      break;
    case "ml":
      newW = Math.max(MIN_BOX_WIDTH, r.startWidth - dx);
      newBoxX = r.startBoxX + (r.startWidth - newW);
      break;
    case "mr":
      newW = Math.max(MIN_BOX_WIDTH, r.startWidth + dx);
      break;
    case "bl":
      newW = Math.max(MIN_BOX_WIDTH, r.startWidth - dx);
      newH = Math.max(MIN_BOX_HEIGHT, r.startHeight + dy);
      newBoxX = r.startBoxX + (r.startWidth - newW);
      break;
    case "bc":
      newH = Math.max(MIN_BOX_HEIGHT, r.startHeight + dy);
      break;
    case "br":
      newW = Math.max(MIN_BOX_WIDTH, r.startWidth + dx);
      newH = Math.max(MIN_BOX_HEIGHT, r.startHeight + dy);
      break;
  }

  newBoxX = Math.max(0, Math.min(newBoxX, r.startBoxX + r.startWidth - MIN_BOX_WIDTH));
  newBoxY = Math.max(0, Math.min(newBoxY, r.startBoxY + r.startHeight - MIN_BOX_HEIGHT));
  newW = Math.max(MIN_BOX_WIDTH, Math.min(newW, canvasWidth - newBoxX));
  newH = Math.max(MIN_BOX_HEIGHT, Math.min(newH, canvasHeight - newBoxY));

  return { boxX: newBoxX, boxY: newBoxY, width: newW, height: newH };
}

const CORNER_DIRECTION: Record<ResizeCorner, {
  sideX: "right" | "left" | "center";
  sideY: "down" | "up" | "center";
}> = {
  tl: { sideX: "left", sideY: "up" },
  tc: { sideX: "center", sideY: "up" },
  tr: { sideX: "right", sideY: "up" },
  ml: { sideX: "left", sideY: "center" },
  mr: { sideX: "right", sideY: "center" },
  bl: { sideX: "left", sideY: "down" },
  bc: { sideX: "center", sideY: "down" },
  br: { sideX: "right", sideY: "down" },
};

/**
 * Aspect-ratio-locked resize. Like `computeResizedBox` but the secondary
 * dimension is always derived from the primary one via `aspect`
 * (width / height), so the box can never stretch. The corner opposite the
 * dragged handle stays fixed; edge handles re-center the free axis.
 */
export function computeAspectResizedBox(
  r: ResizeSnapshot,
  dx: number,
  dy: number,
  canvasWidth: number = 729,
  canvasHeight: number = 729,
  aspect: number
): { boxX: number; boxY: number; width: number; height: number } {
  const sx = r.startBoxX, sy = r.startBoxY;
  const sw = r.startWidth, sh = r.startHeight;
  const safeAspect = aspect > 0 ? aspect : 1;
  const dir = CORNER_DIRECTION[r.corner];

  const centerX = sx + sw / 2;
  const centerY = sy + sh / 2;
  const pinnedX = dir.sideX === "right" ? sx : dir.sideX === "left" ? sx + sw : centerX;
  const pinnedY = dir.sideY === "down" ? sy : dir.sideY === "up" ? sy + sh : centerY;

  // Available room on each axis (for centered axes, limited on both sides).
  const maxW = dir.sideX === "right"
    ? canvasWidth - pinnedX
    : dir.sideX === "left"
      ? pinnedX
      : 2 * Math.min(centerX, canvasWidth - centerX);
  const maxH = dir.sideY === "down"
    ? canvasHeight - pinnedY
    : dir.sideY === "up"
      ? pinnedY
      : 2 * Math.min(centerY, canvasHeight - centerY);

  const widthDriven = dir.sideX !== "center";
  const primary = widthDriven
    ? (dir.sideX === "right" ? sw + dx : sw - dx)
    : (dir.sideY === "down" ? sh + dy : sh - dy);
  const primaryMin = widthDriven ? MIN_BOX_WIDTH : MIN_BOX_HEIGHT;
  const primaryMax = widthDriven ? maxW : maxH;

  let w: number, h: number;
  if (widthDriven) {
    w = Math.max(primaryMin, Math.min(primary, primaryMax));
    h = w / safeAspect;
    h = Math.max(MIN_BOX_HEIGHT, Math.min(h, maxH));
    w = h * safeAspect;
  } else {
    h = Math.max(primaryMin, Math.min(primary, primaryMax));
    w = h * safeAspect;
    w = Math.max(MIN_BOX_WIDTH, Math.min(w, maxW));
    h = w / safeAspect;
  }

  return {
    boxX: Math.round(dir.sideX === "right" ? pinnedX : dir.sideX === "left" ? pinnedX - w : centerX - w / 2),
    boxY: Math.round(dir.sideY === "down" ? pinnedY : dir.sideY === "up" ? pinnedY - h : centerY - h / 2),
    width: Math.round(w),
    height: Math.round(h),
  };
}

/**
 * Recompute the element anchor from the resized box so the opposite corner
 * stays fixed. The box is vertically centered on the element's y
 * (by = pos.y - bh / 2), so y must follow the box center; horizontally the
 * anchor follows the box edge depending on the element alignment. Top-anchored
 * elements (images/logos drawn at their top-left corner) instead anchor y to
 * the box's top edge.
 */
export function computeAnchorFromBox(
  element: { alignment?: string; anchorVertical?: "top" | "center" },
  boxX: number,
  boxY: number,
  width: number,
  height: number
): { x: number; y: number } {
  const alignment = element.alignment || "left";
  const x = alignment === "center"
    ? boxX + width / 2
    : alignment === "right"
      ? boxX + width
      : boxX;
  const y = element.anchorVertical === "top" ? boxY : boxY + height / 2;
  return { x, y };
}

/**
 * Inverse of `computeAnchorFromBox`: derive the box rect from an element
 * anchor. The box is vertically centered on the anchor's y and aligned on x
 * according to the element alignment (same rules as `getElementBoxRect`).
 */
export function computeBoxFromAnchor(
  anchor: { x: number; y: number },
  alignment: string | undefined,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const x = alignment === "center"
    ? anchor.x - width / 2
    : alignment === "right"
      ? anchor.x - width
      : anchor.x;
  return { x, y: anchor.y - height / 2, width, height };
}
