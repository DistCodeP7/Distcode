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

export const problems = pgTable(
  "problems",
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

export const ProblemsSchema = createSelectSchema(problems);
export const NewProblemSchema = createInsertSchema(problems).omit({
  id: true,
});

export type TProblem = zod.infer<typeof ProblemsSchema>;
