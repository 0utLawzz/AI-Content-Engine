import { Router } from "express";
import { db } from "@workspace/db";
import { bulkJobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetBulkJobParams,
  CreateBulkJobBody,
  CancelBulkJobParams,
} from "@workspace/api-zod";

export const bulkJobsRouter = Router();

bulkJobsRouter.get("/", async (req, res) => {
  const jobs = await db.select().from(bulkJobsTable).orderBy(desc(bulkJobsTable.createdAt));
  res.json(jobs.map(formatJob));
});

bulkJobsRouter.post("/", async (req, res) => {
  const body = CreateBulkJobBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const items = body.data.items;
  const [job] = await db.insert(bulkJobsTable).values({
    name: body.data.name,
    projectId: body.data.projectId,
    inputSource: body.data.inputSource ?? "manual",
    totalItems: items.length,
    completedItems: 0,
    failedItems: 0,
    status: "pending",
    items: items,
  }).returning();

  simulateJobProgress(job.id, items.length);

  res.status(201).json(formatJob(job));
});

bulkJobsRouter.get("/:id", async (req, res) => {
  const params = GetBulkJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [job] = await db.select().from(bulkJobsTable).where(eq(bulkJobsTable.id, params.data.id));
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatJob(job));
});

bulkJobsRouter.post("/:id/cancel", async (req, res) => {
  const params = CancelBulkJobParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [job] = await db.update(bulkJobsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(bulkJobsTable.id, params.data.id))
    .returning();
  if (!job) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatJob(job));
});

function formatJob(j: typeof bulkJobsTable.$inferSelect) {
  return {
    id: j.id,
    name: j.name,
    projectId: j.projectId,
    status: j.status,
    totalItems: j.totalItems,
    completedItems: j.completedItems,
    failedItems: j.failedItems,
    inputSource: j.inputSource,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt?.toISOString() ?? null,
    completedAt: j.completedAt?.toISOString() ?? null,
  };
}

function simulateJobProgress(jobId: number, total: number) {
  let completed = 0;
  const interval = setInterval(async () => {
    const [job] = await db.select().from(bulkJobsTable).where(eq(bulkJobsTable.id, jobId));
    if (!job || job.status === "cancelled") { clearInterval(interval); return; }
    completed = Math.min(completed + Math.ceil(total * 0.1), total);
    const done = completed >= total;
    await db.update(bulkJobsTable).set({
      status: done ? "completed" : "running",
      completedItems: completed,
      updatedAt: new Date(),
      completedAt: done ? new Date() : null,
    }).where(eq(bulkJobsTable.id, jobId));
    if (done) clearInterval(interval);
  }, 2000);
}
