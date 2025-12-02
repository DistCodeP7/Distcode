import { eq } from "drizzle-orm";
import type { Difficulty } from "@/app/authorized/checkout/challenge";
import { problems, ratings } from "@/drizzle/schema";
import { db } from "@/lib/db";

export type ExerciseRow = {
  id: number;
  rating: number;
  name: string;
  description: string;
  difficulty: Difficulty;
};

export async function fetchExercises(): Promise<ExerciseRow[]> {
  // Select the full challengeForm JSON and extract fields in JS
  const dbExercises = await db
    .select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      difficulty: problems.difficulty,
    })
    .from(problems)
    .where(eq(problems.isPublished, true));

  const exerciseRows = dbExercises.map(async (ex) => {
    const sum = await db
      .select({ liked: ratings.liked })
      .from(ratings)
      .where(eq(ratings.problemId, ex.id));
    const rating = sum.reduce((acc, curr) => acc + (curr.liked ? 1 : -1), 0);

    return {
      id: ex.id,
      rating,
      name: ex.title,
      description: ex.description,
      difficulty: ex.difficulty as Difficulty,
    };
  });

  return await Promise.all(exerciseRows);
}
