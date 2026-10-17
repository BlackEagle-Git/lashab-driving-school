import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const learnerProgress = pgTable("learner_progress", {
  learnerId: text("learner_id").primaryKey(),
  completedSigns: jsonb("completed_signs").$type<string[]>().notNull().default([]),
  completedScenarios: jsonb("completed_scenarios").$type<string[]>().notNull().default([]),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalAnswers: integer("total_answers").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
