import { eq } from "drizzle-orm";
import { problems, ratings } from "@/drizzle/schema";
import { db } from "./db";
import type {
  CheckoutFormState,
  Difficulty,
} from "@/app/authorized/checkout/challenge";

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
      challengeForm: problems.challengeForm,
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

    const cf = ex.challengeForm as CheckoutFormState as {
      details?: {
        title?: string;
        description?: string;
        difficulty?: Difficulty;
      };
    };

    return {
      isPublished: ex.isPublished,
      id: ex.id,
      title: cf?.details?.title ?? "",
      description: cf?.details?.description ?? "",
      rating,
      difficulty: cf?.details?.difficulty ?? "Easy",
    };
  });

  return await Promise.all(problemRows);
}
