import { eq } from "drizzle-orm";
import {
  problems,
  user_completed_exercises,
  user_ratings,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import type { Difficulty } from "@/types/challenge";

export type ExerciseRow = {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  rating: number;
  isCompleted: boolean;
  userIds?: string[];
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

  const ratings = await db.select().from(user_ratings);

  const completedExercises = await db.select().from(user_completed_exercises);

  const exerciseRows = dbExercises.map(async (ex) => {
    const exerciseRatings = ratings.filter((r) => r.problemId === ex.id);
    const rating = exerciseRatings.reduce(
      (acc, curr) => acc + (curr.rating || 0),
      0
    );
    const isCompleted = completedExercises.some(
      (ce) => ce.problemId === ex.id && ce.isCompleted
    );
    const userIds = completedExercises.map((r) => r.userId);

    return {
      id: ex.id,
      name: ex.title,
      description: ex.description,
      difficulty: ex.difficulty as Difficulty,
      rating,
      isCompleted,
      userIds,
    };
  });

  return await Promise.all(exerciseRows);
}
