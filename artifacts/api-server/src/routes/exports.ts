import { Router } from "express";
import { db } from "@workspace/db";
import { exportsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetExportParams,
  CreateExportBody,
} from "@workspace/api-zod";

export const exportsRouter = Router();

exportsRouter.get("/", async (req, res) => {
  const exports = await db.select().from(exportsTable).orderBy(desc(exportsTable.createdAt));
  res.json(exports.map(formatExport));
});

exportsRouter.post("/", async (req, res) => {
  const body = CreateExportBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [exp] = await db.insert(exportsTable).values({
    projectId: body.data.projectId,
    format: body.data.format,
    platform: body.data.platform,
    status: "pending",
  }).returning();
  simulateExport(exp.id);
  res.status(201).json(formatExport(exp));
});

exportsRouter.get("/:id", async (req, res) => {
  const params = GetExportParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [exp] = await db.select().from(exportsTable).where(eq(exportsTable.id, params.data.id));
  if (!exp) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatExport(exp));
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

function simulateExport(exportId: number) {
  setTimeout(async () => {
    await db.update(exportsTable).set({ status: "processing" }).where(eq(exportsTable.id, exportId));
    setTimeout(async () => {
      await db.update(exportsTable).set({
        status: "completed",
        fileUrl: `https://cdn.example.com/exports/export_${exportId}.mp4`,
        fileSize: Math.floor(Math.random() * 50_000_000) + 5_000_000,
        completedAt: new Date(),
      }).where(eq(exportsTable.id, exportId));
    }, 5000);
  }, 2000);
}
