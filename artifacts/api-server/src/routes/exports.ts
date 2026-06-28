import { Router } from "express";
import { db } from "@workspace/db";
import { exportsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";
import {
  GetExportParams,
  CreateExportBody,
} from "@workspace/api-zod";
import { renderExport, renderLogs, EXPORTS_DIR } from "../lib/renderer";

export const exportsRouter = Router();

exportsRouter.get("/", async (req, res) => {
  const exports = await db.select().from(exportsTable).orderBy(desc(exportsTable.createdAt));
  res.json(exports.map(formatExport));
});

exportsRouter.post("/", async (req, res) => {
  const body = CreateExportBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const [exp] = await db
    .insert(exportsTable)
    .values({
      projectId: body.data.projectId,
      format: body.data.format,
      platform: body.data.platform,
      status: "pending",
    })
    .returning();

  // Fire off real render pipeline in background (do not await)
  renderExport(exp.id, body.data.projectId, body.data.format, body.data.platform).catch(
    (err) => console.error(`Unhandled render error for export ${exp.id}:`, err)
  );

  res.status(201).json(formatExport(exp));
});

exportsRouter.get("/:id", async (req, res) => {
  const params = GetExportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [exp] = await db
    .select()
    .from(exportsTable)
    .where(eq(exportsTable.id, params.data.id));
  if (!exp) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatExport(exp));
});

exportsRouter.get("/:id/logs", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const logs = renderLogs.get(id) ?? [];
  res.json({ exportId: id, logs });
});

exportsRouter.get("/:id/download", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [exp] = await db
    .select()
    .from(exportsTable)
    .where(eq(exportsTable.id, id));

  if (!exp) {
    res.status(404).json({ error: "Export not found" });
    return;
  }

  if (exp.status !== "completed") {
    res.status(409).json({ error: `Export is not ready. Current status: ${exp.status}` });
    return;
  }

  const fileName = `project-${exp.projectId}-export-${exp.id}.mp4`;
  const filePath = path.join(EXPORTS_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Export file not found on disk. It may have been deleted." });
    return;
  }

  const stat = fs.statSync(filePath);
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Accept-Ranges", "bytes");

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on("error", (err) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream file" });
    }
  });
});

function formatExport(e: typeof exportsTable.$inferSelect) {
  return {
    id: e.id,
    projectId: e.projectId,
    format: e.format,
    platform: e.platform,
    status: e.status,
    fileUrl: e.fileUrl,
    fileSize: e.fileSize,
    createdAt: e.createdAt.toISOString(),
    completedAt: e.completedAt?.toISOString() ?? null,
  };
}
