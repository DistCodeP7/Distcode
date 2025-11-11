"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MQJobsSender } from "@/lib/mq";
import { getUserIdByEmail } from "@/lib/user";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import {attempts, submissions, ratings} from "@/drizzle/schema";
import {and, desc, eq} from "drizzle-orm";

export async function getExercise({ params }: { params: { id: number } }) {
  const id = Number(params.id);

  if (Number.isNaN(id)) return { error: "Invalid exercise id", status: 400 };

  const exercise = await db.query.submissions.findFirst({
    where: (sub, { eq }) => eq(sub.id, id),
  });

  if (!exercise) return { error: "Exercise not found", status: 404 };

  if (!exercise.isPublished) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return { error: "Exercise not found", status: 404 };

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId || exercise.userId !== userId)
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

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return { error: "User not found.", status: 404 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid exercise id", status: 400 };

  MQJobsSender.sendMessage({
    ProblemId: problemId,
    UserId: userId,
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
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return { error: "User not found.", status: 404 };

  const submissionId = Number(params.id);
  if (Number.isNaN(submissionId))
    return { error: "Invalid submission id", status: 400 };

  const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

  if (!submission) {
    return { error: "Submission not found.", status: 404 };
  }

  await db.insert(attempts).values({
    userId,
    submissionId,
    codeSubmitted: content,
  });

  return { success: true, message: "Code saved successfully." };
}

export async function loadSavedCode({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return { error: "User not found.", status: 404 };

  const submissionId = Number(params.id);
  if (Number.isNaN(submissionId))
    return { error: "Invalid submission id", status: 400 };

  const [latestAttempt] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.submissionId, submissionId)))
      .orderBy(desc(attempts.id))
      .limit(1);

  if (latestAttempt) {
    return { success: true, code: latestAttempt.codeSubmitted };
  }

  const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

  if (!submission) {
    return { error: "Submission not found.", status: 404 };
  }

  return { success: true, code: submission.templateCode };
}

export async function loadUserRating({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const userId = await getUserIdByEmail(session.user.email);

  const exerciseId = Number(params.id);

  const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.userId, userId), eq(submissions.id, exerciseId)))
      .limit(1);

  if (!submission) return null;

  const [rating] = await db
      .select()
      .from(ratings)
      .where(eq(ratings.submissionId, submission.id))
      .limit(1);

  return rating ? (rating.liked ? "up" : "down") : null;
}


export async function resetCode({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return { error: "Unauthorized", status: 401 };

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId)
    return { error: "User not found.", status: 404 };

  const submissionId = Number(params.id);
  if (Number.isNaN(submissionId))
    return { error: "Invalid submission id", status: 400 };

  await db
      .delete(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.submissionId, submissionId)));

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
  const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, exerciseId)))
      .limit(1);

  if (!submission) {
    return { error: "You must submit at least once before rating.", status: 403 };
  }

  const [existing] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.submissionId, submission.id)))
      .limit(1);

  if (existing) {
    await db
        .update(ratings)
        .set({ liked })
        .where(eq(ratings.id, existing.id));
  } else {
    await db.insert(ratings).values({
      userId,
      submissionId: submission.id,
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

  const submission = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, params.id))
      .limit(1);

  if (!submission.length) return false;

  const attemptsForUser = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.submissionId, params.id)))
      .limit(1);
  return attemptsForUser.length > 0;
}
