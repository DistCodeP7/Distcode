import { users } from "@/drizzle/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function getUserByEmail(email: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return results[0] ?? null;
}

export async function getUserIdByEmail(email: string) {
  const results = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  return results[0]?.id ?? null; 
}
