import { readdirSync, existsSync, readFileSync } from "fs";
import { NextResponse } from "next/server";
import { ASSET_DIRS, festivalTemplatesDir, festivalMappingsDir, festivalFrameTemplatesDir, festivalFrameMappingsDir } from "@/lib/assets.server";
import { festivalTemplatesUrl, festivalMappingsUrl, festivalFrameTemplatesUrl, festivalFrameMappingsUrl } from "@/lib/assets";

export const dynamic = "force-dynamic";

type FrameKind = "phone-frame" | "email-frame";

interface FrameTemplate {
  image: string;
  mapping: string;
}

interface TemplateInfo {
  id: number;
  image: string;
  mapping: string;
  canvas_dim: { w: number; h: number };
  phoneFrame?: FrameTemplate;
  emailFrame?: FrameTemplate;
}

interface FestivalInfo {
  label: string;
  templateCount: number;
  templates: TemplateInfo[];
}

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

function readCanvasDim(mappingsDir: string, filename: string): { w: number; h: number } {
  try {
    const content = readFileSync(`${mappingsDir}/${filename}`, "utf-8");
    const data = JSON.parse(content);
    const size = data.canvasSize || data.canvas_size || { width: 1080, height: 1080 };
    return { w: size.width, h: size.height };
  } catch {
    return { w: 1080, h: 1080 };
  }
}

const numericSort = (a: string, b: string) => {
  const numA = parseInt(a.match(/(\d+)/)?.[1] ?? "0", 10);
  const numB = parseInt(b.match(/(\d+)/)?.[1] ?? "0", 10);
  return numA - numB;
};

function scanFrameTemplates(festivalId: string, frame: FrameKind): FrameTemplate[] {
  const templatesDir = festivalFrameTemplatesDir(festivalId, frame);
  const mappingsDir = festivalFrameMappingsDir(festivalId, frame);

  if (!existsSync(templatesDir) || !existsSync(mappingsDir)) return [];

  const templateFiles = readdirSync(templatesDir)
    .filter((f) => IMAGE_EXTS.some((ext) => f.toLowerCase().endsWith(ext)))
    .sort(numericSort);

  const mappingFiles = readdirSync(mappingsDir)
    .filter((f) => f.endsWith(".json"))
    .sort(numericSort);

  const pairCount = Math.min(templateFiles.length, mappingFiles.length);
  const templates: FrameTemplate[] = [];

  for (let i = 0; i < pairCount; i++) {
    templates.push({
      image: `${festivalFrameTemplatesUrl(festivalId, frame)}/${templateFiles[i]}`,
      mapping: `${festivalFrameMappingsUrl(festivalId, frame)}/${mappingFiles[i]}`,
    });
  }

  return templates;
}

function scanFestival(festivalId: string): FestivalInfo {
  const templatesDir = festivalTemplatesDir(festivalId);
  const mappingsDir = festivalMappingsDir(festivalId);

  if (!existsSync(templatesDir) || !existsSync(mappingsDir)) {
    return { label: festivalId, templateCount: 0, templates: [] };
  }

  const templateFiles = readdirSync(templatesDir)
    .filter((f) => IMAGE_EXTS.some((ext) => f.toLowerCase().endsWith(ext)))
    .sort(numericSort);

  const mappingFiles = readdirSync(mappingsDir)
    .filter((f) => f.endsWith(".json"))
    .sort(numericSort);

  const templates: TemplateInfo[] = [];

  const pairCount = Math.min(templateFiles.length, mappingFiles.length);

  const phoneFrames = scanFrameTemplates(festivalId, "phone-frame");
  const emailFrames = scanFrameTemplates(festivalId, "email-frame");

  for (let i = 0; i < pairCount; i++) {
    templates.push({
      id: i + 1,
      image: `${festivalTemplatesUrl(festivalId)}/${templateFiles[i]}`,
      mapping: `${festivalMappingsUrl(festivalId)}/${mappingFiles[i]}`,
      canvas_dim: readCanvasDim(mappingsDir, mappingFiles[i]),
      phoneFrame: phoneFrames[i],
      emailFrame: emailFrames[i],
    });
  }

  return {
    label: festivalId
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    templateCount: templates.length,
    templates,
  };
}

export async function GET() {
  const festivalBgDir = ASSET_DIRS.festivalTemplates;

  try {
    const dirs = readdirSync(festivalBgDir, { withFileTypes: true }).filter(
      (d) => d.isDirectory()
    );

    const festivals: Record<string, FestivalInfo> = {};

    for (const dir of dirs) {
      festivals[dir.name] = scanFestival(dir.name);
    }

    return NextResponse.json({ festivals });
  } catch {
    return NextResponse.json({ festivals: {} });
  }
}
