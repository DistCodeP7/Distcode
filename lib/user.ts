import { eq } from "drizzle-orm";
import { users } from "@/drizzle/schema";
import { db } from "./db";

export async function getUserByEmail(email: string) {
  const results = await db.select().from(users).where(eq(users.email, email));

  return results[0] ?? null;
}

export async function getUserIdByEmail(email: string) {
  const results = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  return results[0]?.id ?? null;
}

export async function getUserById(id: string) {
  const results = await db.select().from(users).where(eq(users.userid, id));

  return results[0] ?? null;
}

export async function createUser(user: {
  userid: string;
  email: string;
  name: string;
  password: string;
}) {
  const result = await db.insert(users).values(user).returning();
  return result[0];
}

export async function createUserWithOAuth(user: {
  userid: string;
  email: string;
  name: string;
  password: null | string;
  provider: string;
  providerId: string;
}) {
  const result = await db.insert(users).values(user).returning();
  return result[0];
}
