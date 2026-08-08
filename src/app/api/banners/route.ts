import { readdirSync } from "fs";
import { NextResponse } from "next/server";
import { ASSET_DIRS } from "@/lib/assets.server";
import { ASSET_URLS } from "@/lib/assets";
import type { Banner } from "@/types/banner";

export const dynamic = "force-dynamic";

/**
 * Copy for each banner, keyed by the numeric part of the filename
 * (banner-1.png -> 1). Add/remove entries freely — missing banners fall
 * back to an image-only slide.
 *
 * All four banners are Independence Day designs (tricolor flag, Ashoka
 * Chakra, Red Fort, doves) with the headline baked into the artwork, so the
 * overlay copy complements the theme instead of repeating it. Each slide
 * takes a different angle: hero -> templates -> editor -> business.
 */
const BANNER_CONTENT: Record<number, Partial<Banner>> = {
  1: {
    badge: "Independence Day",
    title: "Celebrate Freedom with Beautiful Posters",
    subtitle:
      "Patriotic greeting posters for your business — designed in seconds.",
    cta: { label: "Explore Templates", href: "/templates/independenceday" },
    ctaSecondary: { label: "Start Creating", href: "/festival/independenceday" },
  },
  2: {
    badge: "15 August Special",
    title: "Tricolor Templates, Ready to Edit",
    subtitle:
      "Independence Day designs for wishes, offers and business greetings.",
    cta: { label: "Browse Templates", href: "/templates/independenceday" },
    ctaSecondary: { label: "Create Free", href: "/festival/independenceday" },
  },
  4: {
    badge: "Easy Editor",
    title: "Design Your Greeting in Minutes",
    subtitle: "Drag, drop and download — no design skills required.",
    cta: { label: "Start Creating", href: "/festival/independenceday" },
    ctaSecondary: { label: "See Templates", href: "/templates/independenceday" },
  },
  5: {
    badge: "For Your Business",
    title: "Share Patriotism with Your Customers",
    subtitle:
      "Festive Independence Day wishes that build customer love all year.",
    cta: { label: "Explore Templates", href: "/templates/independenceday" },
    ctaSecondary: { label: "Start Creating", href: "/festival/independenceday" },
  },
};

export async function GET() {
  const bannersDir = ASSET_DIRS.heroBanners;

  try {
    const files = readdirSync(bannersDir);

    const banners: Banner[] = files
      .filter((f) => /^hero-banner-\d+\.\w+$/i.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/hero-banner-(\d+)/)?.[1] ?? "0", 10);
        const numB = parseInt(b.match(/hero-banner-(\d+)/)?.[1] ?? "0", 10);
        return numA - numB;
      })
      .map((file) => {
        const num = file.match(/hero-banner-(\d+)/)?.[1] ?? "0";
        const content = BANNER_CONTENT[parseInt(num, 10)] ?? {};
        return {
          id: num,
          src: `${ASSET_URLS.heroBanners}/${file}`,
          alt: content.title ?? `Banner ${num}`,
          ...content,
          align: content.align ?? "left",
        };
      });

    return NextResponse.json(banners);
  } catch {
    return NextResponse.json([]);
  }
}
