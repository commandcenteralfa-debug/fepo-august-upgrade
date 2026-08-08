"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

interface ScrollItem {
  id: string;
  title: string;
  subtitle?: string;
  gradient: string;
  icon?: React.ReactNode;
  image?: string;
}

interface HorizontalScrollSectionProps {
  title: string;
  items: ScrollItem[];
  onItemClick?: (_id: string) => void;
  itemAspect?: string;
  imageStyle?: "blur" | "full";
}

export default function HorizontalScrollSection({ title, items, onItemClick, itemAspect = "aspect-square", imageStyle = "blur" }: HorizontalScrollSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isJumping = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  const pause = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setIsPaused(true);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      resumeTimerRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const animateScroll = useCallback((el: HTMLDivElement, target: number, duration: number) => {
    cancelAnimationFrame(animFrameRef.current);
    const start = el.scrollLeft;
    const distance = target - start;
    if (distance === 0) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const progress = 1 - (1 - t) * (1 - t);
      el.scrollLeft = start + distance * progress;
      if (progress < 1) animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  const total = items.length;
  const tripled = [...items, ...items, ...items];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || total === 0) return;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = el.scrollWidth / 3;
  }, [total]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || total === 0 || isJumping.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const set = scrollWidth / 3;
    const threshold = set * 0.3;

    if (scrollLeft < threshold) {
      isJumping.current = true;
      el.scrollLeft = scrollLeft + set;
      setTimeout(() => { isJumping.current = false; }, 100);
    } else if (scrollLeft + clientWidth > set * 3 - threshold) {
      isJumping.current = true;
      el.scrollLeft = scrollLeft - set;
      setTimeout(() => { isJumping.current = false; }, 100);
    }
  }, [total]);

  const moveBy = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el || total === 0) return;
    const set = el.scrollWidth / 3;
    const itemWidth = set / total;
    const rel = el.scrollLeft - set;
    let idx = Math.round(rel / itemWidth);
    idx = ((idx + dir) % total + total) % total;
    animateScroll(el, set + idx * itemWidth, 500);
  }, [total, animateScroll]);

  useEffect(() => {
    if (isPaused || total === 0) return;
    const interval = setInterval(() => {
      moveBy(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, total, moveBy]);

  if (total === 0) return null;

  return (
    <section
      className="px-3 py-0.5 md:py-2 lg:py-3"
      onMouseEnter={pause}
      onMouseLeave={scheduleResume}
      onTouchStart={pause}
      onTouchEnd={scheduleResume}
      onTouchCancel={scheduleResume}
    >
      <div className="mb-1 md:mb-3 flex items-center justify-between">
        <h2 className="text-sm md:text-xl lg:text-2xl font-bold text-stone-800">{title}</h2>
      </div>

      <div className="relative flex items-center">
        <button
          onClick={() => moveBy(-1)}
          className="absolute left-0 z-10 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors text-stone-700 -translate-x-1/2"
          aria-label={`Previous ${title}`}
        >
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-2 md:gap-4 pb-2 scrollbar-hide w-full"
          style={{ willChange: "scroll-position" }}
        >
          {tripled.map((item, i) => (
            <motion.div
              key={`${item.id}-${i}`}
              whileHover={{ scale: 1.03 }}
              className="flex-shrink-0 w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.75rem)] snap-center cursor-pointer"
              onClick={() => onItemClick?.(item.id)}
            >
              <div className={`${itemAspect} rounded-lg flex flex-col items-center justify-center p-1 md:p-2 shadow-md relative overflow-hidden bg-gradient-to-br ${item.gradient}`}>
                {item.image ? (
                  <>
                    {imageStyle === "full" ? (
                      <>
                        <Image src={item.image} alt="" fill sizes="20vw" className="object-cover" draggable={false} loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </>
                    ) : (
                      <Image src={item.image} alt="" fill sizes="20vw" className="object-cover blur-[1px] opacity-40" draggable={false} loading="lazy" />
                    )}
                    <span className="relative z-10 text-white font-bold text-sm md:text-xl lg:text-2xl text-center leading-tight drop-shadow-md">
                      {item.title}
                    </span>
                  </>
                ) : item.icon ? (
                  <div className="w-3 h-3 md:w-6 md:h-8 mb-0.5 md:mb-1 flex items-center justify-center">
                    {item.icon}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => moveBy(1)}
          className="absolute right-0 z-10 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-colors text-stone-700 translate-x-1/2"
          aria-label={`Next ${title}`}
        >
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>
      </div>
    </section>
  );
}
