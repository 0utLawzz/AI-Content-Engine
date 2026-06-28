import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exportsTable = pgTable("exports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  format: text("format").notNull().default("mp4"),
  platform: text("platform").notNull().default("instagram_reels"),
  status: text("status").notNull().default("pending"),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertExportSchema = createInsertSchema(exportsTable).omit({ id: true, createdAt: true, completedAt: true });
export type InsertExport = z.infer<typeof insertExportSchema>;
export type Export = typeof exportsTable.$inferSelect;
