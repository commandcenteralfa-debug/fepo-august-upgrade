import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

interface ElementPosition {
  x: number;
  y: number;
}

interface SaveRequest {
  festival: string;
  templateIndex: number;
  positions: Record<string, ElementPosition>;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const { festival, templateIndex, positions } = body;

    if (!festival || templateIndex === undefined || !positions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const jsonFileName = `${templateIndex + 1}.json`;
    const jsonPath = join(process.cwd(), "public", "images", "festival-bg", festival, "mappings", jsonFileName);

    let jsonData;
    try {
      const raw = await readFile(jsonPath, "utf-8");
      jsonData = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Template JSON not found" }, { status: 404 });
    }

    if (jsonData.elements && Array.isArray(jsonData.elements)) {
      jsonData.elements = jsonData.elements.map((el: Record<string, unknown>) => {
        const override = positions[el.id as string];
        if (override) {
          return { ...el, x: override.x, y: override.y };
        }
        return el;
      });
    }

    await writeFile(jsonPath, JSON.stringify(jsonData, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
