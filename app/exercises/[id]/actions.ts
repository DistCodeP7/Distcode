"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MQJobsSender } from "@/lib/mq";
import { getUserById, getUserIdByEmail } from "@/lib/user";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { attempts, problems, ratings } from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";

export async function getExercise({ params }: { params: { id: number } }) {
  const id = Number(params.id);

  if (Number.isNaN(id)) return { error: "Invalid exercise id", status: 400 };

  const exercise = await db.query.problems.findFirst({
    where: (sub, { eq }) => eq(sub.id, id),
  });

  if (!exercise) return { error: "Exercise not found", status: 404 };

  if (!exercise.isPublished) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return { error: "Exercise not found", status: 404 };

    const user = await getUserById(session.user.id);
    if (!user || exercise.userId !== user.id)
      return { error: "Exercise not found", status: 404 };
  }

  return exercise;
}

export async function submitCode(
  content: string[],
  { params }: { params: { id: number } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const user = await getUserById(session.user.id);
  if (!user) return { error: "User not found.", status: 404 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid exercise id", status: 400 };

  MQJobsSender.sendMessage({
    ProblemId: problemId,
    UserId: user.id,
    Code: content,
    Timeoutlimit: 60,
  });

  return { success: true, message: "Code submitted successfully" };
}

export async function saveCode(
  content: string[],
  { params }: { params: { id: number } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const user = await getUserById(session.user.id);
  if (!user) return { error: "User not found.", status: 404 };

  const problemsId = Number(params.id);
  if (Number.isNaN(problemsId))
    return { error: "Invalid problems id", status: 400 };

  const [foundProblem] = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemsId))
    .limit(1);

  if (!foundProblem) {
    return { error: "Problem not found.", status: 404 };
  }

  await db.insert(attempts).values({
    userId: user.id,
    problemId: problemsId,
    codeSubmitted: content,
  });

  return { success: true, message: "Code saved successfully." };
}

export async function loadSavedCode({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return { error: "User not found.", status: 404 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid problem id", status: 400 };

  const [latestAttempt] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.problemId, problemId)))
    .orderBy(desc(attempts.id))
    .limit(1);

  if (latestAttempt) {
    return { success: true, code: latestAttempt.codeSubmitted };
  }

  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);

  if (!problem) {
    return { error: "Submission not found.", status: 404 };
  }

  return { success: true, code: problem.templateCode };
}

export async function loadUserRating({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const userId = await getUserIdByEmail(session.user.email);

  const exerciseId = Number(params.id);

  const [problem] = await db
    .select()
    .from(problems)
    .where(and(eq(problems.userId, userId), eq(problems.id, exerciseId)))
    .limit(1);

  if (!problem) return null;

  const [rating] = await db
    .select()
    .from(ratings)
    .where(eq(ratings.problemId, problem.id))
    .limit(1);

  return rating ? (rating.liked ? "up" : "down") : null;
}

export async function resetCode({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return { error: "User not found.", status: 404 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid problem id", status: 400 };

  await db
    .delete(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.problemId, problemId)));

  return { success: true, message: "Code reset successfully." };
}

export async function rateExercise(
  { params }: { params: { id: number } },
  liked: boolean
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return { error: "User not found.", status: 404 };

  const exerciseId = Number(params.id);
  if (Number.isNaN(exerciseId))
    return { error: "Invalid exercise id", status: 400 };

  // Has user submitted for this exercise?
  const [problem] = await db
    .select()
    .from(problems)
    .where(and(eq(problems.id, exerciseId)))
    .limit(1);

  if (!problem) {
    return {
      error: "You must submit at least once before rating.",
      status: 403,
    };
  }

  const [alreadyRated] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.problemId, problem.id)))
    .limit(1);

  if (alreadyRated) {
    await db
      .update(ratings)
      .set({ liked })
      .where(eq(ratings.id, alreadyRated.id));
  } else {
    await db.insert(ratings).values({
      userId,
      problemId: problem.id,
      liked,
    });
  }

  return { success: true };
}

export async function hasUserSubmitted({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return false;

  const problem = await db
    .select()
    .from(problems)
    .where(eq(problems.id, params.id))
    .limit(1);

  if (!problem.length) return false;

  const attemptsForUser = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.problemId, params.id)))
    .limit(1);
  return attemptsForUser.length > 0;
}
