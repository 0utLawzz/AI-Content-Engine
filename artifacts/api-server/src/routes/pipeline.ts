import { Router } from "express";
import { db } from "@workspace/db";
import { scenesTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { csvAdapter } from "../pipeline/adapters/csv-adapter";
import { jsonAdapter } from "../pipeline/adapters/json-adapter";
import { validatePackage } from "../pipeline/validator";
import { getProvider } from "../pipeline/providers/registry";
import type { NormalizedScene } from "../pipeline/interfaces";
import {
  PipelineImportCsvBody,
  PipelineImportJsonBody,
  PipelineGenerateBody,
  PipelineApplyBody,
} from "@workspace/api-zod";

export const pipelineRouter = Router();

pipelineRouter.post("/import/csv", async (req, res) => {
  const body = PipelineImportCsvBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body", details: body.error.issues });
    return;
  }
  try {
    const pkg = await csvAdapter.parse(body.data.content);
    const result = validatePackage(pkg);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "CSV parse failed";
    res.status(422).json({ error: msg });
  }
});

pipelineRouter.post("/import/json", async (req, res) => {
  const body = PipelineImportJsonBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const pkg = await jsonAdapter.parse(body.data.content);
    const result = validatePackage(pkg);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "JSON parse failed";
    res.status(422).json({ error: msg });
  }
});

pipelineRouter.post("/generate", async (req, res) => {
  const body = PipelineGenerateBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body", details: body.error.issues });
    return;
  }

  const providerName = body.data.provider ?? "local";
  let provider;
  try {
    provider = getProvider(providerName);
  } catch {
    provider = getProvider("local");
  }

  try {
    const scenes = await provider.generate({
      topic: body.data.topic,
      style: body.data.style ?? undefined,
      tone: body.data.tone ?? undefined,
      count: body.data.count,
      pluginSlug: body.data.pluginSlug ?? null,
    });

    const pkg = {
      title: `${body.data.topic} — AI Generated`,
      contentType: body.data.pluginSlug ?? "general",
      description: `Generated via ${providerName} — topic: ${body.data.topic}`,
      scenes,
    };

    const result = validatePackage(pkg);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    res.status(500).json({ error: msg });
  }
});

pipelineRouter.post("/validate", async (req, res) => {
  const pkg = req.body;
  const result = validatePackage(pkg);
  res.json(result);
});

pipelineRouter.post("/apply", async (req, res) => {
  const body = PipelineApplyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { projectId, scenes, replaceExisting } = body.data;

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  let scenesReplaced = 0;
  if (replaceExisting !== false) {
    const existing = await db.select({ id: scenesTable.id }).from(scenesTable).where(eq(scenesTable.projectId, projectId));
    scenesReplaced = existing.length;
    await db.delete(scenesTable).where(eq(scenesTable.projectId, projectId));
  }

  const normalized = scenes as NormalizedScene[];
  for (const scene of normalized) {
    await db.insert(scenesTable).values({
      projectId,
      order: scene.order,
      text: scene.text,
      voiceScript: scene.voiceScript,
      cta: scene.cta ?? null,
      duration: scene.duration,
      animationPreset: scene.animationPreset ?? null,
      backgroundType: scene.backgroundType ?? null,
      subtitleMode: scene.subtitleMode ?? null,
    });
  }

  await db.update(projectsTable)
    .set({ sceneCount: normalized.length, updatedAt: new Date() })
    .where(eq(projectsTable.id, projectId));

  res.json({ projectId, scenesCreated: normalized.length, scenesReplaced });
});
