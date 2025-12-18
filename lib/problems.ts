import { desc, eq } from "drizzle-orm";
import { problems } from "@/drizzle/schema";
import { db } from "@/lib/db";
import type { Difficulty } from "@/types/challenge";
export type Problem = {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  isPublished: boolean;
  lastModified: Date;
};

export async function getProblemsByUserId(userId: string): Promise<Problem[]> {
  const result = await db
    .select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      difficulty: problems.difficulty,
      isPublished: problems.isPublished,
      lastModified: problems.lastModified,
    })
    .from(problems)
    .where(eq(problems.userId, userId))
    .orderBy(desc(problems.lastModified));

  const problemRows = result.map(async (ex) => {
    return {
      isPublished: ex.isPublished,
      id: ex.id,
      title: ex.title,
      description: ex.description,
      difficulty: ex.difficulty as Difficulty,
      lastModified: ex.lastModified,
    };
  });

  return await Promise.all(problemRows);
}
