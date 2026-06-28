import { spawn } from "child_process";
import { db } from "@workspace/db";
import { exportsTable, scenesTable, configurationsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import path from "path";
import fs from "fs";
import os from "os";

export const EXPORTS_DIR = path.join(process.cwd(), "exports");

export const renderLogs = new Map<number, string[]>();

function addLog(exportId: number, message: string) {
  if (!renderLogs.has(exportId)) renderLogs.set(exportId, []);
  const line = `[${new Date().toISOString()}] ${message}`;
  renderLogs.get(exportId)!.push(line);
  console.log(`[render:${exportId}] ${message}`);
}

function getResolution(platform: string): { width: number; height: number } {
  switch (platform) {
    case "youtube":
      return { width: 1920, height: 1080 };
    case "instagram_square":
      return { width: 1080, height: 1080 };
    case "instagram_reels":
    case "tiktok":
    default:
      return { width: 1080, height: 1920 };
  }
}

const THEME_COLORS: Record<string, string> = {
  luxury:    "0x1a0a2e",
  modern:    "0x0f172a",
  corporate: "0x1e3a5f",
  minimal:   "0x1e293b",
  energetic: "0x0d1b2a",
  kids:      "0x1a1a3e",
  cinematic: "0x0a0a0a",
  dark:      "0x111111",
  neon:      "0x0d0d1a",
};

const THEME_TEXT_COLORS: Record<string, string> = {
  luxury:    "0xffd700",
  modern:    "0xffffff",
  corporate: "0xe8f4fd",
  minimal:   "0xffffff",
  energetic: "0xff6b35",
  kids:      "0xffd700",
  cinematic: "0xe0e0e0",
  dark:      "0xffffff",
  neon:      "0x00ffcc",
};

function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\u2019")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/%/g, "\\%");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function runFFmpeg(args: string[], exportId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    addLog(exportId, `ffmpeg ${args.filter(a => !a.includes("drawtext")).slice(0, 8).join(" ")} ...`);
    const proc = spawn("ffmpeg", ["-y", ...args]);
    let stderrBuf = "";
    proc.stderr.on("data", (d: Buffer) => {
      stderrBuf += d.toString();
      const lines = stderrBuf.split("\n");
      stderrBuf = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("frame=") && !trimmed.startsWith("size=")) {
          addLog(exportId, trimmed);
        }
      }
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}. Check logs for details.`));
      }
    });
    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
    });
  });
}

export async function renderExport(
  exportId: number,
  projectId: number,
  _format: string,
  platform: string
) {
  renderLogs.set(exportId, []);

  try {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });

    addLog(exportId, "=== RENDER PIPELINE STARTED ===");
    addLog(exportId, `Export ID: ${exportId} | Project ID: ${projectId} | Platform: ${platform}`);

    await db
      .update(exportsTable)
      .set({ status: "processing" })
      .where(eq(exportsTable.id, exportId));

    const scenes = await db
      .select()
      .from(scenesTable)
      .where(eq(scenesTable.projectId, projectId))
      .orderBy(asc(scenesTable.order));

    if (!scenes.length) {
      throw new Error("No scenes found for this project. Add scenes before rendering.");
    }

    addLog(exportId, `Found ${scenes.length} scene(s) to render`);

    const [configRow] = await db
      .select()
      .from(configurationsTable)
      .where(eq(configurationsTable.projectId, projectId));

    const config = configRow?.config as Record<string, any> | undefined;
    const theme = config?.theme ?? "modern";
    const bgColor = THEME_COLORS[theme] ?? "0x0f172a";
    const textColor = THEME_TEXT_COLORS[theme] ?? "0xffffff";
    const { width, height } = getResolution(platform);

    addLog(exportId, `Theme: ${theme} | Resolution: ${width}x${height}`);

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `render-${exportId}-`));
    addLog(exportId, `Temp workspace: ${tmpDir}`);

    const segmentPaths: string[] = [];

    await db
      .update(exportsTable)
      .set({ status: "encoding" })
      .where(eq(exportsTable.id, exportId));

    addLog(exportId, "=== ENCODING SCENES ===");

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const segPath = path.join(tmpDir, `scene_${String(i).padStart(3, "0")}.mp4`);
      const duration = Math.max(1, scene.duration ?? 5);

      addLog(exportId, `Scene ${i + 1}/${scenes.length}: "${scene.text.slice(0, 50)}${scene.text.length > 50 ? "..." : ""}" (${duration}s)`);

      const maxCharsPerLine = width < 1080 ? 24 : 28;
      const lines = wrapText(scene.text, maxCharsPerLine);

      const fontSize = Math.max(40, Math.floor(width * 0.055));
      const lineHeight = Math.floor(fontSize * 1.4);
      const totalTextHeight = lines.length * lineHeight;
      const startY = Math.floor((height - totalTextHeight) / 2) - Math.floor(height * 0.05);

      const filters: string[] = [];

      lines.forEach((line, li) => {
        const escapedLine = escapeFFmpegText(line);
        const yPos = startY + li * lineHeight;
        filters.push(
          `drawtext=fontsize=${fontSize}:fontcolor=${textColor}:x=(w-text_w)/2:y=${yPos}:text='${escapedLine}':shadowx=2:shadowy=2:shadowcolor=black@0.8`
        );
      });

      const sceneLabel = escapeFFmpegText(`${i + 1} / ${scenes.length}`);
      const smallFont = Math.max(20, Math.floor(fontSize * 0.38));
      filters.push(
        `drawtext=fontsize=${smallFont}:fontcolor=white@0.5:x=w-text_w-24:y=h-text_h-24:text='${sceneLabel}'`
      );

      if (scene.cta) {
        const ctaText = escapeFFmpegText(scene.cta.slice(0, 40));
        const ctaFont = Math.max(28, Math.floor(fontSize * 0.5));
        const ctaY = Math.min(startY + totalTextHeight + Math.floor(lineHeight * 1.2), height - 120);
        filters.push(
          `drawtext=fontsize=${ctaFont}:fontcolor=0xffd700:x=(w-text_w)/2:y=${ctaY}:text='${ctaText}'`
        );
      }

      const filterStr = filters.join(",");

      await runFFmpeg(
        [
          "-f", "lavfi",
          "-i", `color=c=${bgColor}:s=${width}x${height}:r=30`,
          "-vf", filterStr,
          "-t", String(duration),
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-tune", "stillimage",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          segPath,
        ],
        exportId
      );

      segmentPaths.push(segPath);
      addLog(exportId, `Scene ${i + 1} encoded ✓`);
    }

    addLog(exportId, "=== CONCATENATING SCENES ===");

    const concatListPath = path.join(tmpDir, "concat.txt");
    const concatContent = segmentPaths.map((p) => `file '${p}'`).join("\n");
    fs.writeFileSync(concatListPath, concatContent);

    const outputFileName = `project-${projectId}-export-${exportId}.mp4`;
    const outputPath = path.join(EXPORTS_DIR, outputFileName);

    await runFFmpeg(
      [
        "-f", "concat",
        "-safe", "0",
        "-i", concatListPath,
        "-c", "copy",
        "-movflags", "+faststart",
        outputPath,
      ],
      exportId
    );

    const stat = fs.statSync(outputPath);
    const fileUrl = `/api/exports/${exportId}/download`;
    const sizeMB = (stat.size / 1024 / 1024).toFixed(2);

    addLog(exportId, `=== RENDER COMPLETE ===`);
    addLog(exportId, `Output: ${outputPath}`);
    addLog(exportId, `File size: ${sizeMB} MB`);
    addLog(exportId, `Download URL: ${fileUrl}`);

    await db
      .update(exportsTable)
      .set({
        status: "completed",
        fileUrl,
        fileSize: stat.size,
        completedAt: new Date(),
      })
      .where(eq(exportsTable.id, exportId));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    addLog(exportId, `=== RENDER FAILED ===`);
    addLog(exportId, `Error: ${msg}`);
    await db
      .update(exportsTable)
      .set({ status: "failed" })
      .where(eq(exportsTable.id, exportId));
  }
}
