import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  check,
  json,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm/sql/sql";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as zod from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  userid: varchar("userid", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  password: text("password"),
  provider: varchar("provider", { length: 50 }),
  providerId: varchar("providerId", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const UsersSchema = createSelectSchema(users);
export const NewUserSchema = createInsertSchema(users).omit({ id: true });

export type TUser = zod.infer<typeof UsersSchema>;

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description").notNull(),
    difficulty: integer("difficulty").notNull(),
    rating: integer("rating").notNull(),
    problemMarkdown: text("problem_markdown").notNull(),
    templateCode: json("template_code").$type<string[]>().notNull(),
    solutionCode: json("solution_code").$type<string[]>().notNull(),
    testCasesCode: text("test_cases_code").notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (column) => [check("difficulty_check", sql`${column.difficulty} in (1, 2, 3)`)]
);

export const SubmissionsSchema = createSelectSchema(submissions);
export const NewSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
});

export type TSubmission = zod.infer<typeof SubmissionsSchema>;

export const attempts = pgTable("attempts", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    submissionId: integer("submission_id")
        .notNull()
        .references(() => submissions.id, { onDelete: "cascade" }),
    codeSubmitted: json("code_submitted").$type<string[]>().notNull(),
});

export const AttemptsSchema = createSelectSchema(attempts);
export const NewAttemptSchema = createInsertSchema(attempts).omit({ id: true });

export type TAttempt = zod.infer<typeof AttemptsSchema>;