import { Router } from "express";
import { db } from "@workspace/db";
import { scenesTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetProjectScenesParams,
  GenerateScenesParams,
  GenerateScenesBody,
} from "@workspace/api-zod";

export const scenesRouter = Router({ mergeParams: true });

scenesRouter.get("/", async (req, res) => {
  const params = GetProjectScenesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const scenes = await db.select().from(scenesTable)
    .where(eq(scenesTable.projectId, params.data.id))
    .orderBy(scenesTable.order);
  res.json(scenes.map(formatScene));
});

scenesRouter.post("/", async (req, res) => {
  const params = GenerateScenesParams.safeParse(req.params);
  const body = GenerateScenesBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const { count, topic, style } = body.data;
  const projectId = params.data.id;

  await db.delete(scenesTable).where(eq(scenesTable.projectId, projectId));

  const contentBank = getContentBank(topic ?? "motivation", style);
  const generated = [];
  for (let i = 0; i < count; i++) {
    const item = contentBank[i % contentBank.length];
    const [scene] = await db.insert(scenesTable).values({
      projectId,
      order: i,
      text: item.text,
      voiceScript: item.voiceScript,
      cta: item.cta ?? null,
      duration: 5 + Math.random() * 5,
      animationPreset: style ?? "modern",
      backgroundType: "gradient",
      subtitleMode: "sentence",
    }).returning();
    generated.push(scene);
  }

  await db.update(projectsTable).set({ sceneCount: count, updatedAt: new Date() })
    .where(eq(projectsTable.id, projectId));

  res.json(generated.map(formatScene));
});

function getContentBank(topic: string, style?: string) {
  const banks: Record<string, Array<{ text: string; voiceScript: string; cta?: string }>> = {
    motivation: [
      { text: "Success is not final, failure is not fatal.", voiceScript: "Success is not final. Failure is not fatal. It is the courage to continue that counts.", cta: "Follow for daily motivation" },
      { text: "The secret of getting ahead is getting started.", voiceScript: "The secret of getting ahead is getting started. Take the first step today.", cta: "Start your journey now" },
      { text: "It does not matter how slowly you go as long as you do not stop.", voiceScript: "It does not matter how slowly you go, as long as you do not stop moving forward.", cta: "Keep going" },
      { text: "Believe you can and you're halfway there.", voiceScript: "Believe you can, and you're already halfway there. The mind is everything.", cta: "Share with someone who needs this" },
      { text: "The only way to do great work is to love what you do.", voiceScript: "The only way to do great work is to love what you do. Find your passion.", cta: "Follow for more" },
    ],
    wisdom: [
      { text: "Know thyself.", voiceScript: "Know thyself. This ancient wisdom is the foundation of all personal growth.", cta: "Share wisdom" },
      { text: "The unexamined life is not worth living.", voiceScript: "The unexamined life is not worth living. Reflect daily.", cta: "Think deeper" },
      { text: "We suffer more in imagination than in reality.", voiceScript: "We suffer more in imagination than in reality. Let go of fear.", cta: "Save for later" },
      { text: "Waste no more time arguing what a good person should be.", voiceScript: "Waste no more time arguing what a good person should be. Be one.", cta: "Be better today" },
      { text: "The impediment to action advances action.", voiceScript: "The impediment to action advances action. What stands in the way becomes the way.", cta: "Embrace obstacles" },
    ],
    business: [
      { text: "Your most unhappy customers are your greatest source of learning.", voiceScript: "Your most unhappy customers are your greatest source of learning. Listen to them.", cta: "Grow your business" },
      { text: "Chase the vision, not the money.", voiceScript: "Chase the vision, not the money. The money will end up following you.", cta: "Build your vision" },
      { text: "Ideas are easy. Implementation is hard.", voiceScript: "Ideas are easy. Implementation is hard. Execute relentlessly.", cta: "Take action now" },
      { text: "Do not be embarrassed by your failures.", voiceScript: "Do not be embarrassed by your failures. Learn from them and start again.", cta: "Fail forward" },
      { text: "The best marketing doesn't feel like marketing.", voiceScript: "The best marketing doesn't feel like marketing. Create genuine value.", cta: "Market smarter" },
    ],
  };
  return banks[topic] ?? banks.motivation;
}

function formatScene(s: typeof scenesTable.$inferSelect) {
  return {
    id: s.id,
    projectId: s.projectId,
    order: s.order,
    text: s.text,
    voiceScript: s.voiceScript,
    cta: s.cta,
    duration: s.duration,
    animationPreset: s.animationPreset,
    backgroundType: s.backgroundType,
    subtitleMode: s.subtitleMode,
  };
}
