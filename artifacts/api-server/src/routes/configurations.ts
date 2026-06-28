import { Router } from "express";
import { db } from "@workspace/db";
import { configurationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetProjectConfigurationParams,
  UpdateProjectConfigurationParams,
  UpdateProjectConfigurationBody,
} from "@workspace/api-zod";

export const configurationsRouter = Router({ mergeParams: true });

configurationsRouter.get("/", async (req, res) => {
  const params = GetProjectConfigurationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  let [config] = await db.select().from(configurationsTable).where(eq(configurationsTable.projectId, params.data.id));
  if (!config) {
    [config] = await db.insert(configurationsTable).values({ projectId: params.data.id, config: {} }).returning();
  }
  res.json(formatConfig(config));
});

configurationsRouter.put("/", async (req, res) => {
  const params = UpdateProjectConfigurationParams.safeParse(req.params);
  const body = UpdateProjectConfigurationBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }
  let [existing] = await db.select().from(configurationsTable).where(eq(configurationsTable.projectId, params.data.id));
  if (!existing) {
    [existing] = await db.insert(configurationsTable).values({ projectId: params.data.id, config: body.data.config }).returning();
  } else {
    [existing] = await db.update(configurationsTable)
      .set({ config: body.data.config, updatedAt: new Date() })
      .where(eq(configurationsTable.projectId, params.data.id))
      .returning();
  }
  res.json(formatConfig(existing));
});

function formatConfig(c: typeof configurationsTable.$inferSelect) {
  return {
    id: c.id,
    projectId: c.projectId,
    config: c.config,
    updatedAt: c.updatedAt.toISOString(),
  };
}
