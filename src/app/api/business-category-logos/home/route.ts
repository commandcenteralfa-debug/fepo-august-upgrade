import { readdirSync } from "fs";
import { NextResponse } from "next/server";
import { ASSET_DIRS } from "@/lib/assets.server";
import { ASSET_URLS } from "@/lib/assets";

export const dynamic = "force-dynamic";

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

export async function GET() {
  const logosDir = ASSET_DIRS.businessCategoryLogos;

  try {
    const files = readdirSync(logosDir);

    const logos = files
      .filter((f) => IMAGE_EXTS.some((ext) => f.toLowerCase().endsWith(ext)))
      .sort()
      .map((file) => {
        const name = file.replace(/\.[^.]+$/, "");
        return {
          slug: name,
          src: `${ASSET_URLS.businessCategoryLogos}/${file}`,
        };
      });

    return NextResponse.json(logos);
  } catch {
    return NextResponse.json([]);
  }
}
