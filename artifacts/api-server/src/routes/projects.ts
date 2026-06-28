import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, configurationsTable, scenesTable, bulkJobsTable, exportsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import {
  ListProjectsQueryParams,
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  UpdateProjectBody,
  DeleteProjectParams,
} from "@workspace/api-zod";

export const projectsRouter = Router();

projectsRouter.get("/", async (req, res) => {
  const query = ListProjectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { status, contentType } = query.data;
  let rows = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt));
  if (status) rows = rows.filter((p) => p.status === status);
  if (contentType) rows = rows.filter((p) => p.contentType === contentType);
  res.json(rows.map(formatProject));
});

projectsRouter.post("/", async (req, res) => {
  const body = CreateProjectBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [project] = await db.insert(projectsTable).values({
    name: body.data.name,
    description: body.data.description ?? null,
    contentType: body.data.contentType,
    status: "draft",
  }).returning();
  await db.insert(configurationsTable).values({ projectId: project.id, config: defaultConfig() });
  res.status(201).json(formatProject(project));
});

projectsRouter.get("/stats", async (req, res) => {
  const projects = await db.select().from(projectsTable);
  const byStatus = { draft: 0, active: 0, archived: 0 };
  const byTypeMap: Record<string, number> = {};
  for (const p of projects) {
    if (p.status in byStatus) byStatus[p.status as keyof typeof byStatus]++;
    byTypeMap[p.contentType] = (byTypeMap[p.contentType] ?? 0) + 1;
  }
  const [{ total: totalExports }] = await db.select({ total: count() }).from(exportsTable);
  const [{ total: totalBulkJobs }] = await db.select({ total: count() }).from(bulkJobsTable);
  const recent = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt)).limit(5);
  res.json({
    total: projects.length,
    byStatus,
    byContentType: Object.entries(byTypeMap).map(([contentType, c]) => ({ contentType, count: c })),
    recentActivity: recent.map(formatProject),
    totalExports: Number(totalExports),
    totalBulkJobs: Number(totalBulkJobs),
  });
});

projectsRouter.get("/recent", async (req, res) => {
  const rows = await db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt)).limit(8);
  res.json(rows.map(formatProject));
});

projectsRouter.get("/:id", async (req, res) => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(formatProject(project));
});

projectsRouter.patch("/:id", async (req, res) => {
  const params = UpdateProjectParams.safeParse(req.params);
  const body = UpdateProjectBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const [project] = await db.update(projectsTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(formatProject(project));
});

projectsRouter.delete("/:id", async (req, res) => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(scenesTable).where(eq(scenesTable.projectId, params.data.id));
  await db.delete(configurationsTable).where(eq(configurationsTable.projectId, params.data.id));
  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id));
  res.status(204).send();
});

function formatProject(p: typeof projectsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    contentType: p.contentType,
    status: p.status,
    thumbnail: p.thumbnail,
    sceneCount: p.sceneCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function defaultConfig() {
  return {
    branding: { logo: null, watermark: null, primaryColor: "#6366f1", secondaryColor: "#8b5cf6", tagline: null, website: null },
    theme: "modern",
    voice: { provider: "browser", voice: "default", language: "en-US", speed: 1.0, pitch: 1.0 },
    animation: "modern",
    camera: "push_in",
    music: { enabled: true, mood: "inspirational", volume: 0.3 },
    subtitle: { mode: "sentence", enabled: true },
    background: "gradient",
    duration: 30,
    aspectRatio: "9:16",
  };
}
