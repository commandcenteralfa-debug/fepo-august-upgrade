import { describe, expect, it } from "vitest";
import { nextVirtual, prevVirtual, goToVirtual } from "./carouselUtils";

const N = 4; // track has 2n = 8 positions; initial position n = 4 shows banner 0

describe("nextVirtual", () => {
  it("advances one position normally", () => {
    expect(nextVirtual(4, N)).toEqual({ from: 4, to: 5 });
    expect(nextVirtual(6, N)).toEqual({ from: 6, to: 7 });
  });

  it("wraps invisibly at the right edge (2n-1 -> banner 0)", () => {
    // Position 7 shows banner 3, same as position 3 → snap to 3, animate to 4 (banner 0).
    expect(nextVirtual(7, N)).toEqual({ from: 3, to: 4 });
  });
});

describe("prevVirtual", () => {
  it("steps back one position normally", () => {
    expect(prevVirtual(4, N)).toEqual({ from: 4, to: 3 });
    expect(prevVirtual(2, N)).toEqual({ from: 2, to: 1 });
  });

  it("wraps invisibly at the left edge (0 -> banner n-1)", () => {
    // Position 0 shows banner 0, same as position 4 → snap to 4, animate to 3 (banner 3).
    expect(prevVirtual(0, N)).toEqual({ from: 4, to: 3 });
  });
});

describe("goToVirtual", () => {
  it("moves forward to the target banner", () => {
    // v=4 (banner 0) → banner 1: one step forward.
    expect(goToVirtual(4, N, 1)).toEqual({ from: 4, to: 5 });
    // v=5 (banner 1) → banner 3: two steps forward.
    expect(goToVirtual(5, N, 3)).toEqual({ from: 5, to: 7 });
  });

  it("moves backward when that path is shorter", () => {
    // v=3 (banner 3) → banner 2: backward one (forward would be three).
    expect(goToVirtual(3, N, 2)).toEqual({ from: 3, to: 2 });
    // v=0 (banner 0) → banner 3: backward one via the left-edge twin.
    expect(goToVirtual(0, N, 3)).toEqual({ from: 4, to: 3 });
  });

  it("wraps invisibly at the right edge", () => {
    // v=7 (banner 3) → banner 0: forward one via the right-edge twin.
    expect(goToVirtual(7, N, 0)).toEqual({ from: 3, to: 4 });
  });

  it("supports direct jumps of several slides", () => {
    // v=4 (banner 0) → banner 2: forward two.
    expect(goToVirtual(4, N, 2)).toEqual({ from: 4, to: 6 });
    // v=6 (banner 2) → banner 0: forward two hits the right edge, so snap
    // invisibly to the twin of banner 2 (position 2) and animate to 4.
    expect(goToVirtual(6, N, 0)).toEqual({ from: 2, to: 4 });
  });
});
