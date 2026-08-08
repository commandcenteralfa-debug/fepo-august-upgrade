"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  animate,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Image from "next/image";
import type { Banner } from "@/types/banner";
import {
  nextVirtual,
  prevVirtual,
  goToVirtual,
  type VirtualMove,
} from "@/lib/carouselUtils";

const AUTOPLAY_MS = 5000;
const SLIDE_DURATION = 0.6; // 500–700ms premium ease
const SLIDE_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const DRAG_VELOCITY_THRESHOLD = 0.4; // px/ms flick to advance
const DRAG_FRACTION_THRESHOLD = 0.15; // fraction of width dragged to advance

const textContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
};

const textItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: SLIDE_EASE } },
};

const ctaVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: SLIDE_EASE } },
};

const MotionImage = motion(Image);

interface SlideProps {
  banner: Banner;
  isActive: boolean;
  eager: boolean;
  reduceMotion: boolean | null;
}

function Slide({ banner, isActive, eager, reduceMotion }: SlideProps) {
  return (
    <div className="relative w-full h-full shrink-0 overflow-hidden">
      {/* Ken Burns — fills the box absolutely so no gaps appear at any height */}
      <MotionImage
        src={banner.src}
        alt={banner.alt}
        fill
        sizes="100vw"
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className="object-cover object-center"
        style={{ willChange: "transform" }}
        initial={false}
        animate={
          reduceMotion || !isActive ? { scale: 1 } : { scale: [1, 1.08] }
        }
        transition={
          reduceMotion || !isActive
            ? { duration: 0.5 }
            : { duration: 9, ease: "linear", repeat: Infinity, repeatType: "mirror" }
        }
      />

      {/* Legibility scrims */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 via-black/20 to-transparent"
      />

      {/* Sequential content */}
      <motion.div
        variants={textContainerVariants}
        initial="hidden"
        animate={isActive ? "show" : "hidden"}
        className="absolute inset-0 z-10 flex items-center px-6 sm:px-10 md:px-14 lg:px-20 xl:px-24"
      >
        <div className="max-w-xl">
          {banner.badge && (
            <motion.span
              variants={textItemVariants}
              className="inline-block bg-white/15 backdrop-blur-md border border-white/25 text-white px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase"
            >
              {banner.badge}
            </motion.span>
          )}
          {banner.title && (
            <motion.h2
              variants={textItemVariants}
              className="mt-2 md:mt-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-headline text-white leading-[1.12] text-balance"
            >
              {banner.title}
            </motion.h2>
          )}
          {banner.subtitle && (
            <motion.p
              variants={textItemVariants}
              className="mt-2 md:mt-2.5 text-xs sm:text-sm md:text-base text-white/85 max-w-md leading-relaxed text-balance"
            >
              {banner.subtitle}
            </motion.p>
          )}
          {(banner.cta || banner.ctaSecondary) && (
            <motion.div
              variants={ctaVariants}
              className="mt-5 md:mt-7 flex flex-wrap items-center gap-3"
            >
              {banner.cta && (
                <a
                  href={banner.cta.href}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dim text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold shadow-lg shadow-black/25 transition-colors active:scale-[0.98]"
                >
                  {banner.cta.label}
                  <ArrowRight size={16} className="md:w-[18px] md:h-[18px]" />
                </a>
              )}
              {banner.ctaSecondary && (
                <a
                  href={banner.ctaSecondary.href}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-colors active:scale-[0.98]"
                >
                  {banner.ctaSecondary.label}
                </a>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function HeroBannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [virtualIndex, setVirtualIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinePointer, setIsFinePointer] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const virtualIndexRef = useRef(0);
  const nextRef = useRef<() => void>(() => {});
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    basePx: number;
    active: boolean;
    lastX: number;
    lastT: number;
    vel: number;
  } | null>(null);

  const trackX = useMotionValue(0);
  const trackOpacity = useMotionValue(1);
  const reduceMotion = useReducedMotion();
  const justDraggedRef = useRef(false);

  const n = banners.length;
  const activeBannerIndex = ((virtualIndex % n) + n) % n;

  useEffect(() => {
    fetch("/api/banners")
      .then((res) => res.json())
      .then((data: Banner[]) => setBanners(data))
      .catch(() => setBanners([]));
  }, []);

  const getWidth = useCallback(
    () => widthRef.current || containerRef.current?.clientWidth || 0,
    []
  );

  // (Re)position the track when the banner set changes.
  useEffect(() => {
    if (n <= 1) {
      virtualIndexRef.current = 0;
      setVirtualIndex(0);
      trackX.set(0);
      trackOpacity.set(1);
      return;
    }
    virtualIndexRef.current = n; // start on banner 0 (slide at position n)
    setVirtualIndex(n);
    trackOpacity.set(1);
    // The container isn't measured yet on the first pass; the ResizeObserver
    // below snaps the track to the true pixel position right after.
    trackX.set(-n * (getWidth() || 1));
  }, [n, trackX, trackOpacity, getWidth]);

  // Measure the container width, and keep the track pixel-aligned on resize.
  // `n` is a dependency so this re-runs once the container actually renders
  // (it does not exist on first mount, when the banner list is still empty).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      widthRef.current = el.offsetWidth || el.clientWidth || 0;
      trackX.set(-virtualIndexRef.current * widthRef.current);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n, trackX]);

  // Only desktop-style pointers hover (and pause autoplay).
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setIsFinePointer(mq.matches);
    const onChange = () => setIsFinePointer(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const slideTo = useCallback(
    (to: number) => {
      const w = getWidth();
      if (w <= 0) return;
      virtualIndexRef.current = to;
      setVirtualIndex(to);
      if (reduceMotion) {
        trackX.set(-to * w);
        trackOpacity.set(1);
        return;
      }
      animate(trackX, -to * w, {
        duration: SLIDE_DURATION,
        ease: SLIDE_EASE,
      });
      // Subtle fade dip mid-slide to honor the "fade + slight slide" feel.
      animate(trackOpacity, [1, 0.55, 1], {
        duration: SLIDE_DURATION,
        times: [0, 0.35, 1],
        ease: "easeInOut",
      });
    },
    [reduceMotion, trackX, trackOpacity, getWidth]
  );

  const navigate = useCallback(
    (move: VirtualMove) => {
      // Invisible snap to the twin position when the move wraps the track.
      const w = getWidth();
      if (w <= 0) return;
      if (move.from !== virtualIndexRef.current) {
        trackX.set(-move.from * w);
      }
      slideTo(move.to);
    },
    [slideTo, trackX, getWidth]
  );

  const next = useCallback(
    () => navigate(nextVirtual(virtualIndexRef.current, n)),
    [navigate, n]
  );
  const prev = useCallback(
    () => navigate(prevVirtual(virtualIndexRef.current, n)),
    [navigate, n]
  );
  const goTo = useCallback(
    (k: number) => navigate(goToVirtual(virtualIndexRef.current, n, k)),
    [navigate, n]
  );

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pauseNow = useCallback(() => {
    clearResumeTimer();
    setIsPaused(true);
  }, [clearResumeTimer]);

  const scheduleResume = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      resumeTimerRef.current = null;
    }, AUTOPLAY_MS);
  }, [clearResumeTimer]);

  // Auto-slide every 5s unless paused (hover / drag / manual navigation).
  useEffect(() => {
    if (isPaused || n <= 1) return;
    const id = setInterval(() => {
      if (!document.hidden) nextRef.current();
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isPaused, n]);

  useEffect(() => {
    return () => {
      clearResumeTimer();
    };
  }, [clearResumeTimer]);

  // ---- Drag / swipe with momentum --------------------------------------
  // Uses window-level pointer listeners (instead of setPointerCapture) so
  // pointer capture can't retarget clicks on the arrows/dots/CTAs, and the
  // drag keeps tracking even when the pointer leaves the banner.

  const handleWindowMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      // Require a clear horizontal intent before treating it as a drag.
      if (!d.active) {
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) d.active = true;
        if (!d.active) return;
      }

      trackX.set(d.basePx + dx);

      const now = performance.now();
      const dt = now - d.lastT;
      if (dt > 0) {
        const instVel = (e.clientX - d.lastX) / dt;
        d.vel = 0.75 * d.vel + 0.25 * instVel;
      }
      d.lastX = e.clientX;
      d.lastT = now;
    },
    [trackX]
  );

  const endDrag = useCallback(
    (e: PointerEvent) => {
      window.removeEventListener("pointermove", handleWindowMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);

      const d = dragRef.current;
      dragRef.current = null;
      if (!d) return;

      const dx = e.clientX - d.startX;

      if (d.active) {
        justDraggedRef.current = true;
        const width = widthRef.current || 1;
        const pxThreshold = width * DRAG_FRACTION_THRESHOLD;
        if (dx < -pxThreshold || d.vel < -DRAG_VELOCITY_THRESHOLD) {
          next();
        } else if (dx > pxThreshold || d.vel > DRAG_VELOCITY_THRESHOLD) {
          prev();
        } else {
          animate(trackX, d.basePx, {
            type: "spring",
            stiffness: 320,
            damping: 32,
          });
        }
      }

      scheduleResume();
    },
    [handleWindowMove, next, prev, scheduleResume, trackX]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (n <= 1) return;
      justDraggedRef.current = false;
      // Defensive: clear any listeners left over from a pointerup that was
      // never delivered (e.g. mouse released outside the window).
      window.removeEventListener("pointermove", handleWindowMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      // Stop any in-flight slide animation and base the drag on the live
      // track position, so grabbing mid-slide never causes a jump.
      trackX.stop();
      trackOpacity.set(1);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        basePx: trackX.get(),
        active: false,
        lastX: e.clientX,
        lastT: performance.now(),
        vel: 0,
      };
      window.addEventListener("pointermove", handleWindowMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
      pauseNow();
    },
    [n, pauseNow, handleWindowMove, endDrag, trackX, trackOpacity]
  );

  // Clean up any in-flight drag listeners if the component unmounts mid-gesture.
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleWindowMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [handleWindowMove, endDrag]);

  const suppressClickAfterDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (justDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      justDraggedRef.current = false;
    }
  }, []);

  // ---- Keyboard navigation ----------------------------------------------

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (n <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        pauseNow();
        prev();
        scheduleResume();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        pauseNow();
        next();
        scheduleResume();
      }
    },
    [n, next, prev, pauseNow, scheduleResume]
  );

  const handleArrow = useCallback(
    (fn: () => void) => {
      pauseNow();
      fn();
      scheduleResume();
    },
    [pauseNow, scheduleResume]
  );

  // Arrows are hover-revealed only on pointer:fine devices; touch devices
  // (including tablets) keep them always visible since hover doesn't exist.
  const arrowVisibility = isFinePointer
    ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
    : "opacity-100";

  if (n === 0) return null;

  return (
    <section className="w-full pt-14 md:pt-16 pb-0.5 md:pb-1">
      {/* Full-width edge-to-edge hero: spans the whole viewport (no max-w
          column). A small gutter keeps the rounded corners visible at the
          screen edges. */}
      <div className="relative mx-2 sm:mx-3 md:mx-4">
        <div
          ref={containerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured promotions"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onClickCapture={suppressClickAfterDrag}
          onMouseEnter={() => isFinePointer && pauseNow()}
          onMouseLeave={() => {
            if (isFinePointer) setIsPaused(false);
          }}
          className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-stone-200 shadow-lg h-[192px] sm:h-[256px] md:h-[280px] lg:h-[360px] xl:h-[400px] touch-pan-y select-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
        >
          <motion.div
            className="flex h-full will-change-transform"
            style={{ x: trackX, opacity: trackOpacity }}
          >
            {n > 1
              ? Array.from({ length: 2 * n }).map((_, vi) => (
                  <Slide
                    key={vi}
                    banner={banners[vi % n]}
                    isActive={vi === virtualIndex}
                    // The initial view sits at position n (banner 0), so both
                    // that slide and position 0 load eagerly.
                    eager={vi === 0 || vi === n}
                    reduceMotion={reduceMotion}
                  />
                ))
              : banners.map((banner) => (
                  <Slide
                    key={banner.id}
                    banner={banner}
                    isActive
                    eager
                    reduceMotion={reduceMotion}
                  />
                ))}
          </motion.div>

          {n > 1 && (
            <>
              <button
                type="button"
                onClick={() => handleArrow(prev)}
                aria-label="Previous slide"
                className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-black/5 shadow-lg text-stone-700 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 ${arrowVisibility}`}
              >
                <ChevronLeft size={20} className="md:w-[22px] md:h-[22px]" />
              </button>
              <button
                type="button"
                onClick={() => handleArrow(next)}
                aria-label="Next slide"
                className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-black/5 shadow-lg text-stone-700 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 ${arrowVisibility}`}
              >
                <ChevronRight size={20} className="md:w-[22px] md:h-[22px]" />
              </button>
            </>
          )}

        </div>

        {n > 1 && (
          <div className="relative mt-4 w-fit mx-auto z-20 flex items-center justify-center gap-1.5 bg-white/55 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-md md:absolute md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:mt-0">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => handleArrow(() => goTo(i))}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activeBannerIndex ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeBannerIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-stone-400/70 hover:bg-stone-500"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
