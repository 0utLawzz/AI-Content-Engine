import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scenesTable = pgTable("scenes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  order: integer("order").notNull().default(0),
  text: text("text").notNull(),
  voiceScript: text("voice_script").notNull(),
  cta: text("cta"),
  duration: real("duration").notNull().default(5),
  animationPreset: text("animation_preset"),
  backgroundType: text("background_type"),
  subtitleMode: text("subtitle_mode"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSceneSchema = createInsertSchema(scenesTable).omit({ id: true, createdAt: true });
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenesTable.$inferSelect;
