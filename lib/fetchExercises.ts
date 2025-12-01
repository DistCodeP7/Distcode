import { eq } from "drizzle-orm";
import { problems, ratings } from "@/drizzle/schema";
import { db } from "@/lib/db";
import type {
  CheckoutFormState,
  Difficulty,
} from "@/app/authorized/checkout/challenge";

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
    .select({ id: problems.id, challengeForm: problems.challengeForm })
    .from(problems)
    .where(eq(problems.isPublished, true));

  const exerciseRows = dbExercises.map(async (ex) => {
    const sum = await db
      .select({ liked: ratings.liked })
      .from(ratings)
      .where(eq(ratings.problemId, ex.id));
    const rating = sum.reduce((acc, curr) => acc + (curr.liked ? 1 : -1), 0);

    const cf = ex.challengeForm as CheckoutFormState as {
      details?: {
        title?: string;
        description?: string;
        difficulty?: Difficulty;
      };
    };

    return {
      id: ex.id,
      rating,
      name: cf?.details?.title ?? "",
      description: cf?.details?.description ?? "",
      difficulty: cf?.details?.difficulty ?? "Easy",
    };
  });

  return await Promise.all(exerciseRows);
}
