import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  json,
  boolean,
} from "drizzle-orm/pg-core";

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as zod from "zod";

export type Paths = { [key: string]: string };

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

  type newReplicaConfig = {
    alias: string;
    envs: newEnv[];
  };

   type newEnv = { key: string; value: string };

export const problems = pgTable(
  "problems",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.userid, { onDelete: "cascade" }),
    problemMarkdown: text("problem_markdown").notNull(),
    studentCode: json("student_code").$type<Paths>().notNull(),
    solutionCode: text("solution_code").notNull(),
    protocolCode: json("protocol_code").$type<Paths>().notNull(),
    testCode: json("test_code").$type<Paths>().notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    difficulty: varchar("difficulty", { length: 50 }).notNull(),
    testAlias: varchar("test_alias", { length: 100 }).notNull(),
    selectedTestPath: json("selected_test_path").$type<string[]>().notNull(),
    testBuildCommand: text("test_build_command").notNull(),
    testEntryCommand: text("test_entry_command").notNull(),
    testEnvs: json("test_envs").$type<newEnv[]>().notNull(),
    submissionBuildCommand: text("submission_build_command").notNull(),
    submissionEntryCommand: text("submission_entry_command").notNull(),
    globalEnvs: json("global_envs").$type<newEnv[]>().notNull(),
    replicaConfigs: json("replica_configs")
      .$type<newReplicaConfig[]>()
      .notNull(),

   
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
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
    codeSubmitted: json("code_submitted").$type<Paths>().notNull(),
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

