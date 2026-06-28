import { pgTable, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const configurationsTable = pgTable("configurations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  config: jsonb("config").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConfigurationSchema = createInsertSchema(configurationsTable).omit({ id: true, updatedAt: true });
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type Configuration = typeof configurationsTable.$inferSelect;
