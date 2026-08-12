import { join } from "path";

const PUBLIC_DIR = join(process.cwd(), "public");

export const ASSET_DIRS = {
  heroBanners: join(PUBLIC_DIR, "homepage", "banners"),
  festivalLogos: join(PUBLIC_DIR, "homepage", "logos", "festival"),
  businessCategoryLogos: join(PUBLIC_DIR, "homepage", "logos", "business-category"),
  calendarDateLogos: join(PUBLIC_DIR, "homepage", "calendar", "date"),
  festivalTemplates: join(PUBLIC_DIR, "templates", "festival"),
} as const;

export function festivalTemplatesDir(festivalId: string): string {
  return join(ASSET_DIRS.festivalTemplates, festivalId, "templates");
}

export function festivalMappingsDir(festivalId: string): string {
  return join(ASSET_DIRS.festivalTemplates, festivalId, "mapping");
}

export function festivalFrameTemplatesDir(festivalId: string, frame: "phone-frame" | "email-frame"): string {
  return join(ASSET_DIRS.festivalTemplates, festivalId, frame, "templates");
}

export function festivalFrameMappingsDir(festivalId: string, frame: "phone-frame" | "email-frame"): string {
  return join(ASSET_DIRS.festivalTemplates, festivalId, frame, "mapping");
}
