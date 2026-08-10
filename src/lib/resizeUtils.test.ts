import { describe, expect, it } from "vitest";
import {
  CANVAS_SIZE,
  MIN_BOX_HEIGHT,
  MIN_BOX_WIDTH,
  RESIZE_HANDLES,
  computeAnchorFromBox,
  computeAspectResizedBox,
  computeBoxFromAnchor,
  computeResizedBox,
  getResizeCursor,
  type ResizeCorner,
} from "./resizeUtils";

describe("resize handles", () => {
  it("defines exactly 8 handles at the expected positions", () => {
    expect(RESIZE_HANDLES.map((h) => h.id)).toEqual(["tl", "tc", "tr", "ml", "mr", "bl", "bc", "br"]);
  });

  it("maps each handle to its directional cursor", () => {
    expect(getResizeCursor("tl")).toBe("nwse-resize");
    expect(getResizeCursor("tc")).toBe("ns-resize");
    expect(getResizeCursor("tr")).toBe("nesw-resize");
    expect(getResizeCursor("ml")).toBe("ew-resize");
    expect(getResizeCursor("mr")).toBe("ew-resize");
    expect(getResizeCursor("bl")).toBe("nesw-resize");
    expect(getResizeCursor("bc")).toBe("ns-resize");
    expect(getResizeCursor("br")).toBe("nwse-resize");
  });

  it("falls back to the default cursor for unknown handles", () => {
    expect(getResizeCursor("zz" as ResizeCorner)).toBe("default");
  });
});

describe("computeAnchorFromBox", () => {
  const box = { boxX: 40, boxY: 30, width: 200, height: 80 };

  it("anchors left-aligned elements at the top-left box corner", () => {
    expect(computeAnchorFromBox({ alignment: "left" }, box.boxX, box.boxY, box.width, box.height))
      .toEqual({ x: 40, y: 70 });
  });

  it("anchors center-aligned elements at the box center", () => {
    expect(computeAnchorFromBox({ alignment: "center" }, box.boxX, box.boxY, box.width, box.height))
      .toEqual({ x: 140, y: 70 });
  });

  it("anchors right-aligned elements at the top-right box corner", () => {
    expect(computeAnchorFromBox({ alignment: "right" }, box.boxX, box.boxY, box.width, box.height))
      .toEqual({ x: 240, y: 70 });
  });

  it("defaults a missing alignment to left", () => {
    expect(computeAnchorFromBox({}, box.boxX, box.boxY, box.width, box.height))
      .toEqual({ x: 40, y: 70 });
  });

  it("anchors top-anchored elements (logos) at the box top-left", () => {
    expect(computeAnchorFromBox({ alignment: "left", anchorVertical: "top" }, box.boxX, box.boxY, box.width, box.height))
      .toEqual({ x: 40, y: 30 });
  });

  it("anchors center-aligned top-anchored elements at the top-center", () => {
    expect(computeAnchorFromBox({ alignment: "center", anchorVertical: "top" }, box.boxX, box.boxY, box.width, box.height))
      .toEqual({ x: 140, y: 30 });
  });
});

describe("computeResizedBox", () => {
  const start = { startBoxX: 100, startBoxY: 100, startWidth: 200, startHeight: 80 };

  it("resizes from the bottom-right corner", () => {
    expect(computeResizedBox({ corner: "br", ...start }, 50, 30))
      .toEqual({ boxX: 100, boxY: 100, width: 250, height: 110 });
  });

  it("resizes from the bottom-left corner", () => {
    expect(computeResizedBox({ corner: "bl", ...start }, -50, 30))
      .toEqual({ boxX: 50, boxY: 100, width: 250, height: 110 });
  });

  it("resizes from the top-right corner", () => {
    expect(computeResizedBox({ corner: "tr", ...start }, 50, -30))
      .toEqual({ boxX: 100, boxY: 70, width: 250, height: 110 });
  });

  it("resizes from the top-left corner", () => {
    expect(computeResizedBox({ corner: "tl", ...start }, -50, -30))
      .toEqual({ boxX: 50, boxY: 70, width: 250, height: 110 });
  });

  it("resizes from the top-center handle", () => {
    expect(computeResizedBox({ corner: "tc", ...start }, 0, -30))
      .toEqual({ boxX: 100, boxY: 70, width: 200, height: 110 });
  });

  it("resizes from the bottom-center handle", () => {
    expect(computeResizedBox({ corner: "bc", ...start }, 0, 30))
      .toEqual({ boxX: 100, boxY: 100, width: 200, height: 110 });
  });

  it("resizes from the middle-left handle", () => {
    expect(computeResizedBox({ corner: "ml", ...start }, -50, 0))
      .toEqual({ boxX: 50, boxY: 100, width: 250, height: 80 });
  });

  it("resizes from the middle-right handle", () => {
    expect(computeResizedBox({ corner: "mr", ...start }, 50, 0))
      .toEqual({ boxX: 100, boxY: 100, width: 250, height: 80 });
  });

  it("clamps the width to MIN_BOX_WIDTH", () => {
    expect(computeResizedBox({ corner: "br", ...start }, -500, 0).width).toBe(MIN_BOX_WIDTH);
  });

  it("clamps the height to MIN_BOX_HEIGHT", () => {
    expect(computeResizedBox({ corner: "br", ...start }, 0, -500).height).toBe(MIN_BOX_HEIGHT);
  });

  it("clamps the box to the canvas bounds", () => {
    const nearRight = { startBoxX: 600, startBoxY: 100, startWidth: 100, startHeight: 80 };
    const box = computeResizedBox({ corner: "br", ...nearRight }, 300, 0);
    expect(box.boxX + box.width).toBe(CANVAS_SIZE);
  });

  it("keeps the opposite corner fixed when resizing from the top-left", () => {
    const box = computeResizedBox({ corner: "tl", ...start }, -50, -30);
    expect(box.boxX + box.width).toBe(start.startBoxX + start.startWidth);
    expect(box.boxY + box.height).toBe(start.startBoxY + start.startHeight);
  });
});

describe("computeAspectResizedBox", () => {
  const start = { startBoxX: 200, startBoxY: 200, startWidth: 200, startHeight: 100 };
  const aspect = start.startWidth / start.startHeight; // 2

  it("preserves the aspect ratio from the bottom-right handle", () => {
    const box = computeAspectResizedBox({ corner: "br", ...start }, 60, 40, 729, 729, aspect);
    expect(box).toEqual({ boxX: 200, boxY: 200, width: 260, height: 130 });
  });

  it("keeps the box inside the canvas when pushed past the edge", () => {
    const nearRight = { startBoxX: 600, startBoxY: 200, startWidth: 100, startHeight: 50 };
    const box = computeAspectResizedBox({ corner: "br", ...nearRight }, 300, 0, 729, 729, 2);
    expect(box.boxX + box.width).toBe(CANVAS_SIZE);
    expect(box.width / box.height).toBeCloseTo(2, 1);
  });

  it("clamps to the minimum size", () => {
    const box = computeAspectResizedBox({ corner: "br", ...start }, -500, 0, 729, 729, aspect);
    expect(box.width).toBe(MIN_BOX_WIDTH);
    expect(box.width / box.height).toBeCloseTo(aspect, 5);
  });

  const cornerCases: { corner: ResizeCorner; dx: number; dy: number }[] = [
    { corner: "br", dx: 60, dy: 40 },
    { corner: "bl", dx: -60, dy: 40 },
    { corner: "tr", dx: 60, dy: -40 },
    { corner: "tl", dx: -60, dy: -40 },
    { corner: "tc", dx: 0, dy: -40 },
    { corner: "bc", dx: 0, dy: 40 },
    { corner: "ml", dx: -60, dy: 0 },
    { corner: "mr", dx: 60, dy: 0 },
  ];

  it("preserves the aspect ratio for every handle", () => {
    for (const c of cornerCases) {
      const box = computeAspectResizedBox({ corner: c.corner, ...start }, c.dx, c.dy, 729, 729, aspect);
      expect(box.width / box.height).toBeCloseTo(aspect, 5);
    }
  });

  it("keeps the top-anchored (logo) box anchored for every handle", () => {
    for (const c of cornerCases) {
      const box = computeAspectResizedBox({ corner: c.corner, ...start }, c.dx, c.dy, 729, 729, aspect);
      const anchor = computeAnchorFromBox({ alignment: "left", anchorVertical: "top" }, box.boxX, box.boxY, box.width, box.height);
      // A logo's box is drawn at its anchor directly, so the anchor must be the box top-left.
      expect(anchor.x).toBe(box.boxX);
      expect(anchor.y).toBe(box.boxY);
    }
  });
});

describe("resize keeps the element anchored (all corners × alignments)", () => {
  const start = { startBoxX: 200, startBoxY: 200, startWidth: 200, startHeight: 80 };
  const alignments = ["left", "center", "right"] as const;
  const cornerCases: { corner: ResizeCorner; dx: number; dy: number }[] = [
    { corner: "br", dx: 60, dy: 40 },
    { corner: "bl", dx: -60, dy: 40 },
    { corner: "tr", dx: 60, dy: -40 },
    { corner: "tl", dx: -60, dy: -40 },
    { corner: "tc", dx: 0, dy: -40 },
    { corner: "bc", dx: 0, dy: 40 },
    { corner: "ml", dx: -60, dy: 0 },
    { corner: "mr", dx: 60, dy: 0 },
  ];

  for (const alignment of alignments) {
    for (const c of cornerCases) {
      it(`${c.corner} keeps the box anchored for ${alignment} alignment`, () => {
        const box = computeResizedBox({ corner: c.corner, ...start }, c.dx, c.dy);
        const anchor = computeAnchorFromBox({ alignment }, box.boxX, box.boxY, box.width, box.height);
        const derived = computeBoxFromAnchor(anchor, alignment, box.width, box.height);
        // The derived box must reproduce the resized box exactly, i.e. the
        // opposite corner of the drag stays fixed.
        expect(derived.x).toBeCloseTo(box.boxX);
        expect(derived.y).toBeCloseTo(box.boxY);
      });
    }
  }
});
