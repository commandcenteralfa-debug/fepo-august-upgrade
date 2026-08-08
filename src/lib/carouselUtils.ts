/**
 * Pure navigation math for an infinite, track-based carousel.
 *
 * The track contains `2n` slides (each banner rendered twice). A virtual
 * index `v` in [0, 2n - 1] addresses a track position; position `v` renders
 * banner `v % n`. Positions `v` and `v ± n` render the *same* banner, which
 * is what makes the infinite wrap invisible: when a navigation step would
 * leave the track, we first snap (no animation) to the twin position that
 * shows the current banner, then animate to the real target.
 */

export interface VirtualMove {
  /** Track position to snap to instantly (invisible because it shows the
   *  same banner as the current position). Equals the current position when
   *  no snap is needed. */
  from: number;
  /** Track position to animate to. */
  to: number;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Next slide (forward). */
export function nextVirtual(v: number, n: number): VirtualMove {
  if (n <= 0) return { from: v, to: v };
  const max = 2 * n - 1;
  if (v < max) return { from: v, to: v + 1 };
  // At the right edge: snap to the twin of the current banner, then animate
  // one step forward into banner 0.
  return { from: n - 1, to: n };
}

/** Previous slide (backward). */
export function prevVirtual(v: number, n: number): VirtualMove {
  if (n <= 0) return { from: v, to: v };
  if (v > 0) return { from: v, to: v - 1 };
  // At the left edge: snap to the twin of the current banner, then animate
  // one step backward into banner n - 1.
  return { from: n, to: n - 1 };
}

/**
 * Go to a specific banner index `k` (0-based) using the shortest slide
 * direction. Handles wrapping at both track edges via the invisible-snap
 * trick.
 */
export function goToVirtual(v: number, n: number, k: number): VirtualMove {
  if (n <= 0) return { from: v, to: v };
  const target = mod(k, n);
  const current = mod(v, n);

  let delta = mod(target - current, n); // forward distance 0..n-1
  if (delta > n / 2) delta -= n; // prefer the shorter backward path

  const to = v + delta;

  if (to < 0) {
    // Left edge: snap forward to the twin (same banner), animate to twin + delta.
    return { from: v + n, to: to + n };
  }
  if (to >= 2 * n) {
    // Right edge: snap backward to the twin (same banner), animate to twin + delta.
    return { from: v - n, to: to - n };
  }
  return { from: v, to };
}
