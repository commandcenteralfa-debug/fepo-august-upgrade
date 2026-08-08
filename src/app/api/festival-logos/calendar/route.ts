import { readdirSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { ASSET_DIRS } from "@/lib/assets.server";
import { ASSET_URLS } from "@/lib/assets";

export const dynamic = "force-dynamic";

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];
const DATE_FILE = /^(\d{2})-(\d{2})-(\d{4})$/;

export async function GET() {
  const logosDir = ASSET_DIRS.calendarDateLogos;

  try {
    const logos: { date: string; src: string }[] = [];

    const yearDirs = readdirSync(logosDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    for (const year of yearDirs) {
      const files = readdirSync(join(logosDir, year));
      for (const file of files) {
        if (!IMAGE_EXTS.some((ext) => file.toLowerCase().endsWith(ext))) continue;

        const match = file.replace(/\.[^.]+$/, "").match(DATE_FILE);
        if (!match) continue;

        const [, dd, mm, yyyy] = match;
        logos.push({
          date: `${yyyy}-${mm}-${dd}`,
          src: `${ASSET_URLS.calendarDateLogos}/${year}/${file}`,
        });
      }
    }

    logos.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    return NextResponse.json(logos);
  } catch {
    return NextResponse.json([]);
  }
}
