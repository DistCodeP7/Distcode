import { eq } from "drizzle-orm";
import { problems, user_exercise_stats } from "@/drizzle/schema";
import { db } from "@/lib/db";
import type { Difficulty } from "@/types/challenge";

export type ExerciseRow = {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  rating: number;
  isCompleted: boolean;
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

  const ratings = await db.select().from(user_exercise_stats);

  const exerciseRows = dbExercises.map(async (ex) => {
    const exerciseRatings = ratings.filter((r) => r.problemId === ex.id);
    const rating =
      exerciseRatings.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
      (exerciseRatings.length || 1);
    const isCompleted = exerciseRatings.some((r) => r.isCompleted);
    return {
      id: ex.id,
      name: ex.title,
      description: ex.description,
      difficulty: ex.difficulty as Difficulty,
      rating,
      isCompleted,
    };
  });

  return await Promise.all(exerciseRows);
}
