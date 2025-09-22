import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as zod from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).unique(),
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

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 256 }).notNull(),
  markdown: text("markdown").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const SubmissionsSchema = createSelectSchema(submissions);
export const NewSubmissionSchema = createInsertSchema(submissions).omit({ id: true });

export type TSubmission = zod.infer<typeof SubmissionsSchema>;