"use client";

/**
 * Presentational selection box rendered above the canvas.
 *
 * Shows a dashed blue border with a soft glow, the element id badge, and the
 * 8 resize handles for the currently selected item. It is purely cosmetic:
 * pointer events pass through to the canvas, where useElementEditor handles
 * all hit-testing and interaction. Position is given in template units and
 * converted to percentages so it tracks the canvas exactly at any display
 * size. The `key` remount replays the 150–200ms fade/scale entrance whenever
 * the selection changes.
 */

import { RESIZE_HANDLES, type Rect } from "@/lib/resizeUtils";

interface SelectionOverlayProps {
  /** Id of the selected item (used as the remount key and badge label). */
  itemId: string;
  /** Selected item bounding box in template units. */
  rect: Rect;
  /** Whether a resize/pinch gesture is in progress (shows the live size label). */
  isResizing: boolean;
  /** Whether the item can be resized (hides the handles when false). Defaults to true. */
  resizable?: boolean;
  /** Show the element-id pill above the box. Defaults to true. */
  showBadge?: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export default function SelectionOverlay({ itemId, rect, isResizing, resizable = true, showBadge = true, canvasWidth, canvasHeight }: SelectionOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
      <div
        key={itemId}
        className="selection-box"
        style={{
          left: `${(rect.x / canvasWidth) * 100}%`,
          top: `${(rect.y / canvasHeight) * 100}%`,
          width: `${(rect.width / canvasWidth) * 100}%`,
          height: `${(rect.height / canvasHeight) * 100}%`,
        }}
      >
        {showBadge && <span className="selection-badge">{itemId}</span>}
        {resizable !== false && RESIZE_HANDLES.map((h) => (
          <span
            key={h.id}
            className="selection-handle"
            style={{ left: `${h.left}%`, top: `${h.top}%`, cursor: h.cursor }}
          />
        ))}
        {isResizing && (
          <span className="selection-size">
            {Math.round(rect.width)} × {Math.round(rect.height)}
          </span>
        )}
      </div>
    </div>
  );
}
