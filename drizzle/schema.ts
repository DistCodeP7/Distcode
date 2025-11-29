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


type Path = string;
type code = string;

export type EnvironmentVariable = {
  key: string;
  value: string;
}

export type Filemap = Record<Path, code>;

export type nodeSpec = {
  Files: Filemap;
  Envs: EnvironmentVariable[];
  BuildCommand: string;
  EntryCommand: string;
}

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
    userId: varchar("user_id")
      .notNull()
      .references(() => users.userid, { onDelete: "cascade" }),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description").notNull(),
    difficulty: integer("difficulty").notNull(),
    problemMarkdown: text("problem_markdown").notNull(),
    studentCode: json("student_code").$type<string[]>().notNull(),
    solutionCode: text("solution_code").notNull(),
    protocolCode: text("protocol_code").notNull(),
    testCode: json("test_code").$type<string[]>().notNull(),
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

export const userCode = pgTable("userCode", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
        .notNull()
        .references(() => users.userid, { onDelete: "cascade" }),
    problemId: integer("problem_id")
        .notNull()
        .references(() => problems.id, { onDelete: "cascade" }),
    codeSubmitted: json("code_submitted").$type<nodeSpec>().notNull(),
});

export const UserCodeSchema = createSelectSchema(userCode);
export const NewUserCodeSchema = createInsertSchema(userCode).omit({ id: true });

export type TUserCode = zod.infer<typeof UserCodeSchema>;

export const ratings = pgTable("ratings", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
        .notNull()
        .references(() => users.userid, { onDelete: "cascade" }),
    problemId: integer("problem_id")
        .notNull()
        .references(() => problems.id, { onDelete: "cascade" }),
    liked: boolean("liked").notNull(),
});

export const RatingsSchema = createSelectSchema(ratings);
export const NewRatingSchema = createInsertSchema(ratings).omit({ id: true });

export type TRating = zod.infer<typeof RatingsSchema>;

