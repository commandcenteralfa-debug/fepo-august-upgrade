"use client";

import { useLayoutEffect, useRef, useState } from "react";
import CanvasRenderer from "./CanvasRenderer";
import { useDesign, getCanvasDimensions } from "@/context/DesignContext";

export default function MainPreview() {
  const { state } = useDesign();
  const { width: tplW, height: tplH } = getCanvasDimensions(state);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Measure the workspace so the canvas is maximized while always fitting.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(el).paddingLeft || "0") || 0;
      setStage({ w: Math.max(1, rect.width - pad * 2), h: Math.max(1, rect.height - pad * 2) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ready = stage.w > 0 && stage.h > 0;
  const scale = ready ? Math.min(stage.w / tplW, stage.h / tplH) : 1;
  const dispW = tplW * scale;
  const dispH = tplH * scale;

  return (
    <div
      ref={stageRef}
      className="relative w-full h-[55vh] min-h-[320px] md:h-[480px] flex items-center justify-center p-2 md:p-4 bg-stone-100 border border-stone-200 rounded-lg overflow-hidden"
    >
      {ready && (
        <div
          className="relative shrink-0"
          style={{ width: dispW, height: dispH }}
        >
          <CanvasRenderer variantIndex={state.activeVariantIndex} isMain />
        </div>
      )}
    </div>
  );
}
