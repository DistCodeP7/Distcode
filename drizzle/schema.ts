import { LogEventPayload, Outcome, TestResult } from "@/types/streamingEvents";
import {
  bigint,
  boolean,
  integer,
  json,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

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


export type Paths = { [key: string]: string };

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

export const job_results = pgTable("job_results", {
  id: serial("id").primaryKey(),
  jobUid: varchar("job_uid").notNull().unique(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.userid, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problems.id, { onDelete: "cascade" }),
  outcome: json("outcome").$type<Outcome>(),
  test_results: json("test_results").$type<TestResult[]>(),
  duration: integer("duration"),
  finishedAt: timestamp("finished_at"),
  logs: jsonb("logs").$type<LogEventPayload[]>(),
});

export const Job_ResultsSchema = createSelectSchema(job_results);
export const NewJob_ResultsSchema = createInsertSchema(job_results).omit({ id: true });

export type TResults = typeof job_results.$inferSelect; 
export type NewResult = typeof job_results.$inferInsert;

export type VClock = { [key: string]: number };

export const job_process_messages = pgTable("job_process_messages", {
  id: serial("id").primaryKey(),
  jobUid: varchar("job_uid")
  .notNull()
  .references(() => job_results.jobUid, { onDelete: "cascade" }),
timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  from: varchar("from").notNull(),
  to: varchar("to").notNull(),
  type: varchar("type").notNull(),
  vector_clock: json("vector_clock").$type<VClock>().notNull(),
  payload: text("payload"),
});

export const Job_Process_MessagesSchema = createSelectSchema(job_process_messages);
export const NewJob_Process_MessagesSchema = createInsertSchema(job_process_messages).omit({ id: true });

export type TJob_Process_Messages = zod.infer<typeof Job_Process_MessagesSchema>;