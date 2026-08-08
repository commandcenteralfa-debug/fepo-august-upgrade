import { describe, expect, it } from "vitest";
import { getTemplateTransform } from "./canvasUtils";

describe("getTemplateTransform", () => {
  it("maps a same-sized JSON 1:1 onto the canvas", () => {
    const t = getTemplateTransform(
      { width: 1080, height: 1080 },
      { x: 0, y: 0, width: 1080, height: 1080 }
    );
    expect(t).toEqual({ scaleX: 1, scaleY: 1, fontScale: 1, dx: 0, dy: 0 });
  });

  it("scales a 1920x1080 JSON down onto a 1080x540 canvas", () => {
    const t = getTemplateTransform(
      { width: 1920, height: 1080 },
      { x: 0, y: 0, width: 1080, height: 540 }
    );
    expect(t.scaleX).toBeCloseTo(0.5625);
    expect(t.scaleY).toBeCloseTo(0.5);
    expect(t.fontScale).toBeCloseTo(0.53125);
    expect(t.dx).toBe(0);
    expect(t.dy).toBe(0);
  });

  it("offsets positions by the contain-letterbox origin", () => {
    const t = getTemplateTransform(
      { width: 1080, height: 1080 },
      { x: 60, y: 120, width: 810, height: 810 }
    );
    expect(t).toEqual({ scaleX: 0.75, scaleY: 0.75, fontScale: 0.75, dx: 60, dy: 120 });
  });

  it("shifts a same-sized JSON down 19px and right 2px with scale unchanged", () => {
    // The JSON sits slightly too high/left: target rect is shifted down by 19px
    // and right by 2px on a 1080 canvas while width/height stay full-size.
    const t = getTemplateTransform(
      { width: 1080, height: 1080 },
      { x: 2, y: 19, width: 1080, height: 1080 }
    );
    expect(t).toEqual({ scaleX: 1, scaleY: 1, fontScale: 1, dx: 2, dy: 19 });
  });

  it("falls back to the image rect when the JSON canvas size is missing", () => {
    const t = getTemplateTransform(null, { x: 10, y: 20, width: 500, height: 500 });
    expect(t).toEqual({ scaleX: 1, scaleY: 1, fontScale: 1, dx: 10, dy: 20 });
  });

  it("falls back to 1 per axis when only one JSON dimension is valid", () => {
    const t = getTemplateTransform(
      { width: 540, height: 0 },
      { x: 0, y: 0, width: 1080, height: 1080 }
    );
    expect(t.scaleX).toBe(2);
    expect(t.scaleY).toBe(1);
  });
});
