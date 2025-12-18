"use server";

import { and, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { v4 as uuid } from "uuid";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { problems, user_ratings, userCode } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { MQJobsCanceller, MQJobsSender, ready } from "@/lib/mq";
import { getUserById } from "@/lib/user";
import type {
  ContainerConfigs,
  Filemap,
  fullPayload,
  SubmissionConfig,
  TestContainerConfig,
} from "@/types/actionTypes";
import { checkUserCode } from "@/utils/validateCode";

export async function getExercise({ params }: { params: { id: number } }) {
  const id = Number(params.id);

  if (Number.isNaN(id)) return { error: "Invalid exercise id", status: 400 };

  const exercise = await db.query.problems.findFirst({
    where: (sub, { eq }) => eq(sub.id, id),
  });

  if (!exercise) return { error: "Exercise not found", status: 404 };

  if (!exercise.isPublished) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "User not found", status: 404 };

    const user = await getUserById(session.user.id);
    if (!user || exercise.userId !== user.userid)
      return { error: "User not found", status: 404 };
  }

  return exercise;
}

export async function submitCode(
  submissionCode: Filemap,
  { params }: { params: { id: number } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const user = await getUserById(session.user.id);
  if (!user) return { error: "User not found.", status: 404 };

  const ProblemId = Number(params.id);
  if (Number.isNaN(ProblemId))
    return { error: "Invalid exercise id", status: 400 };

  const exercise = await db.query.problems.findFirst({
    where: (s, { eq }) => eq(s.id, ProblemId),
  });

  if (!exercise) {
    return { error: "Exercise not found.", status: 404 };
  }

  const unusedImports = await checkUserCode(submissionCode);
  if (unusedImports) {
    return {
      error: `All imports must be used. Unused import(s): ${unusedImports.join(
        ", "
      )}`,
      status: 400,
    };
  }

  const testFiles: Filemap = Object.fromEntries(
    exercise.selectedTestPath.map((path: string) => [
      path,
      exercise.testCode[path],
    ])
  );

  Object.keys(exercise.protocolCode).forEach((path) => {
    testFiles[path] = exercise.protocolCode[path];
    submissionCode[path] = exercise.protocolCode[path];
  });

  const submissionContatiner: SubmissionConfig = {
    submissionCode,
    buildCommand: exercise.submissionBuildCommand,
    entryCommand: exercise.submissionEntryCommand,
    globalEnvs: exercise.globalEnvs,
    replicaConfigs: exercise.replicaConfigs,
  };

  const testContainer: TestContainerConfig = {
    alias: exercise.testAlias,
    testFiles: testFiles,
    envs: exercise.testEnvs,
    buildCommand: exercise.testBuildCommand,
    entryCommand: exercise.testEntryCommand,
  };

  const contentArray: ContainerConfigs = {
    submission: submissionContatiner,
    testContainer: testContainer,
  };

  const payload: fullPayload = {
    jobUid: `${uuid()}`,
    nodes: contentArray,
    userId: user.userid,
    timeout: exercise.timeout,
    problemId: exercise.id,
    submittedAt: new Date(Date.now()),
  };

  await ready;
  MQJobsSender.sendMessage(payload);

  return {
    success: true,
    message: "Code submitted successfully",
    jobUid: payload.jobUid,
  };
}

export async function saveCode(
  content: Filemap,
  { params }: { params: { id: number } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const user = await getUserById(session.user.id);
  if (!user) return { error: "User not found.", status: 404 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid exercise id", status: 400 };

  const [foundProblem] = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);

  if (!foundProblem) return { error: "Exercise not found.", status: 404 };

  const [existing] = await db
    .select()
    .from(userCode)
    .where(
      and(eq(userCode.userId, user.userid), eq(userCode.problemId, problemId))
    )
    .limit(1);

  if (existing) {
    await db
      .update(userCode)
      .set({ codeSubmitted: content })
      .where(
        and(eq(userCode.userId, user.userid), eq(userCode.problemId, problemId))
      );
  } else {
    await db.insert(userCode).values({
      userId: user.userid,
      problemId,
      codeSubmitted: content,
    });
  }

  return { success: true, message: "Code saved successfully." };
}

export async function loadSavedCode({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid problem id", status: 400 };

  const [latestUserCode] = await db
    .select()
    .from(userCode)
    .where(
      and(
        eq(userCode.userId, session.user.id),
        eq(userCode.problemId, problemId)
      )
    )
    .orderBy(desc(userCode.id))
    .limit(1);

  if (latestUserCode) {
    return { success: true, code: latestUserCode.codeSubmitted };
  }

  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);

  if (!problem) {
    return { error: "Submission not found.", status: 404 };
  }

  return { success: true, code: problem.studentCode };
}

export async function cancelJobRequest(jobUid: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  await MQJobsCanceller.sendMessage({
    jobUid: jobUid,
    action: "cancel",
  });
}

export async function resetCode({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid problem id", status: 400 };

  await db
    .delete(userCode)
    .where(
      and(
        eq(userCode.userId, session.user.id),
        eq(userCode.problemId, problemId)
      )
    );

  return { success: true, message: "Code reset successfully." };
}

export async function rateExercise(
  rating: boolean,
  { params }: { params: { id: number } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };
  const userId = session.user.id;

  const problemId = Number(params.id);
  if (Number.isNaN(problemId))
    return { error: "Invalid problem id", status: 400 };

  if (
    await db
      .select()
      .from(user_ratings)
      .where(
        and(
          eq(user_ratings.userId, userId),
          eq(user_ratings.problemId, problemId)
        )
      )
      .limit(1)
      .then((res) => res.length > 0)
  ) {
    await db
      .update(user_ratings)
      .set({ rating: rating ? 1 : -1 })
      .where(
        and(
          eq(user_ratings.userId, userId),
          eq(user_ratings.problemId, problemId)
        )
      );
  } else {
    await db.insert(user_ratings).values({
      userId: userId,
      problemId: problemId,
      rating: rating ? 1 : -1,
    });
  }

  return { success: true, message: "Exercise rated successfully." };
}
