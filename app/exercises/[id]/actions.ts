"use server";

import { and, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { v4 as uuid } from "uuid"; // Example for a common UUID library in JS
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { problems, ratings, userCode } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { MQJobsSender } from "@/lib/mq";
import { getUserById } from "@/lib/user";

export type Filemap = {
  [key: string]: string;
};

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
  type fullPayload = {
    jobUid: string;
    nodes: ContainerConfigs;
    userId: string;
    timeout: number;
  };

  type ContainerConfigs = {
    testContainer: TestContainerConfig;
    submission: SubmissionConfig;
  };

  type SubmissionConfig = {
    submissionCode: Filemap;
    buildCommand: string;
    entryCommand: string;
    globalEnvs: newEnv[];
    replicaConfigs: newReplicaConfig[];
  };

  type TestContainerConfig = {
    alias: string;
    testFiles: Filemap;
    buildCommand: string;
    entryCommand: string;
    envs: newEnv[];
  };

  type newReplicaConfig = {
    alias: string;
    envs: newEnv[];
  };

  type newEnv = { key: string; value: string };

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
  const challengeForm = exercise.challengeForm;

  const globalEnvs: newEnv[] = challengeForm.submission.globalEnvs.map(
    (env) => {
      return { key: env.key, value: env.value };
    }
  );

  const envs: newEnv[] = challengeForm.testContainer.envs.map((env) => {
    return { key: env.key, value: env.value };
  });

  const replicaConfigs: newReplicaConfig[] = Object.values(
    challengeForm.submission.replicaConfigs
  ).map((replica) => {
    return {
      alias: replica.alias,
      envs: replica.envs.map((env) => {
        return { key: env.key, value: env.value };
      }),
    };
  });

  const submissionContatiner: SubmissionConfig = {
    submissionCode,
    buildCommand: challengeForm.submission.buildCommand,
    entryCommand: challengeForm.submission.entryCommand,
    globalEnvs,
    replicaConfigs,
  };

  const testContainer: TestContainerConfig = {
    alias: "test_runner",
    testFiles: challengeForm.testContainer.testFiles,
    envs,
    buildCommand: challengeForm.testContainer.buildCommand,
    entryCommand: challengeForm.testContainer.entryCommand,
  };

  const contentArray: ContainerConfigs = {
    submission: submissionContatiner,
    testContainer: testContainer,
  };

  const payload: fullPayload = {
    jobUid: `${uuid()}`,
    nodes: contentArray,
    userId: user.userid,
    timeout: 60,
  };

  MQJobsSender.sendMessage(payload);

  return { success: true, message: "Code submitted successfully" };
}

export async function saveCode(
  content: Filemap,
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

  await db.insert(userCode).values({
    userId: user.userid,
    problemId: problemsId,
    codeSubmitted: content,
  });

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

export async function loadUserRating({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const exerciseId = Number(params.id);

  const [problem] = await db
    .select()
    .from(problems)
    .where(
      and(eq(problems.userId, session.user.id), eq(problems.id, exerciseId))
    )
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
  { params }: { params: { id: number } },
  liked: boolean
) {
  //TODO: Change to look if exercise is completed instead of this
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const exerciseId = Number(params.id);
  if (Number.isNaN(exerciseId))
    return { error: "Invalid exercise id", status: 400 };

  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.id, exerciseId))
    .limit(1);

  if (!problem) {
    return {
      error: "Then exercise doesnt exist",
      status: 403,
    };
  }

  const [alreadyRated] = await db
    .select()
    .from(ratings)
    .where(
      and(
        eq(ratings.userId, session.user.id),
        eq(ratings.problemId, problem.id)
      )
    )
    .limit(1);

  if (alreadyRated) {
    await db
      .update(ratings)
      .set({ liked })
      .where(eq(ratings.id, alreadyRated.id));
  } else {
    await db.insert(ratings).values({
      userId: session.user.id,
      problemId: problem.id,
      liked,
    });
  }

  return { success: true };
}

export async function hasUserSubmitted({ params }: { params: { id: number } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const problem = await db
    .select()
    .from(problems)
    .where(eq(problems.id, params.id))
    .limit(1);

  if (!problem.length) return false;

  const UserCode = await db
    .select()
    .from(userCode)
    .where(
      and(
        eq(userCode.userId, session.user.id),
        eq(userCode.problemId, params.id)
      )
    )
    .limit(1);
  return UserCode.length > 0;
}
