import { eq } from "drizzle-orm";
import type { Difficulty } from "@/app/authorized/checkout/challenge";
import { problems } from "@/drizzle/schema";
import { db } from "./db";
export type Problem = {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  isPublished: boolean;
};

export async function getProblemsByUserId(userId: string): Promise<Problem[]> {
  const result = await db
    .select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      difficulty: problems.difficulty,
      isPublished: problems.isPublished,
    })
    .from(problems)
    .where(eq(problems.userId, userId));

  const problemRows = result.map(async (ex) => {
    return {
      isPublished: ex.isPublished,
      id: ex.id,
      title: ex.title,
      description: ex.description,
      difficulty: ex.difficulty as Difficulty,
    };
  });

  return await Promise.all(problemRows);
}
