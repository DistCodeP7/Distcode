import { eq } from "drizzle-orm";
import type { Difficulty } from "@/app/authorized/checkout/challenge";
import { problems, ratings } from "@/drizzle/schema";
import { db } from "./db";
export type ProblemWithRating = {
  id: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  isPublished: boolean;
  rating: number | null;
};

export async function getProblemsByUserId(
  userId: string
): Promise<ProblemWithRating[]> {
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
    const sum = await db
      .select({ liked: ratings.liked })
      .from(ratings)
      .where(eq(ratings.problemId, ex.id));
    const rating = sum.reduce((acc, curr) => acc + (curr.liked ? 1 : -1), 0);

    return {
      isPublished: ex.isPublished,
      id: ex.id,
      title: ex.title,
      description: ex.description,
      rating,
      difficulty: ex.difficulty as Difficulty,
    };
  });

  return await Promise.all(problemRows);
}
