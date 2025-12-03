"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Paths } from "@/drizzle/schema";
import { problems } from "@/drizzle/schema";

type NewEnv = { key: string; value: string };
type NewReplicaConfig = { alias: string; envs: NewEnv[] };
type NewProblem = {
  userId: string;
  problemMarkdown: string;
  studentCode: Paths;
  solutionCode: string;
  protocolCode: Paths;
  testCode: Paths;
  isPublished?: boolean;
  title: string;
  description: string;
  difficulty: string;
  testAlias: string;
  selectedTestPath: string[];
  testBuildCommand: string;
  testEntryCommand: string;
  testEnvs: NewEnv[];
  submissionBuildCommand: string;
  submissionEntryCommand: string;
  globalEnvs: NewEnv[];
  replicaConfigs: NewReplicaConfig[];
};

import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";
import type { CheckoutFormState } from "../checkout/challenge";

export type ApiResult =
  | { success: true; message: string; status: number }
  | { success: false; error: string; status: number };

export type SaveProblemParams = {
  id?: number;
  problemMarkdown: string;
  studentCode: Paths;
  solutionCode: string;
  testCode: Paths;
  protocolCode: Paths;
  isPublished?: boolean;
};

export async function saveProblem(data: SaveProblemParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  const { id, isPublished = false, ...problemData } = data;
  let existingProblem = null;

  if (id) {
    existingProblem = await db.query.problems.findFirst({
      where: (s, { eq: _eq }) => _eq(s.id, id),
    });
    if (!existingProblem) {
      return { success: false, error: "Problem not found", status: 404 };
    }
    if (existingProblem.userId !== session.user.id) {
      return { success: false, error: "Forbidden", status: 403 };
    }
  }

  const dataToValidate = { ...existingProblem, ...problemData };
  const fieldsToValidate = [
    { value: dataToValidate.problemMarkdown, name: "Problem markdown" },
    { value: dataToValidate.studentCode, name: "Student code" },
    { value: dataToValidate.solutionCode, name: "Solution code" },
    { value: dataToValidate.testCode, name: "Test code" },
  ];

  for (const field of fieldsToValidate) {
    const isMapField =
      field.name.includes("Student") || field.name.includes("Test");
    if (!field.value) {
      return {
        success: false,
        error: `${field.name} is required (missing).`,
        status: 400,
      };
    }
    if (isMapField) {
      if (
        typeof field.value !== "object" ||
        Object.keys(field.value).length === 0
      ) {
        return {
          success: false,
          error: `${field.name} is required (empty).`,
          status: 400,
        };
      }
    } else if (typeof field.value === "string" && field.value.trim() === "") {
      return {
        success: false,
        error: `${field.name} is required (empty).`,
        status: 400,
      };
    }
  }
  let exerciseId = id;
  try {
    if (id) {
      await db
        .update(problems)
        .set({
          ...problemData,
        })
        .where(eq(problems.id, id));
    } else {
      const result = await db
        .insert(problems)
        .values({
          ...problemData,
          userId: session.user.id,
          problemMarkdown: problemData.problemMarkdown,
          studentCode: problemData.studentCode,
          solutionCode: problemData.solutionCode,
          protocolCode: problemData.protocolCode,
          testCode: problemData.testCode,
          isPublished: false,
          title: "",
          description: "",
          difficulty: "",
          testAlias: "test-container",
          selectedTestPath: [],
          testBuildCommand: "go build -o ./test ./test/test.go",
          testEntryCommand: "./test",
          testEnvs: [],
          submissionBuildCommand: "go build -o ./student ./student/main.go",
          submissionEntryCommand: "./student",
          globalEnvs: [],
          replicaConfigs: [{ alias: "student-replica-1", envs: [] }],
        } as NewProblem)
        .returning();
      exerciseId = result[0].id;
    }

    return {
      success: true,
      message: isPublished
        ? "Problem published successfully!"
        : "Draft saved successfully.",
      status: 200,
      id: exerciseId,
    };
  } catch (err) {
    return {
      success: false,
      error: `An internal server error occurred.${err}`,
      status: 500,
    };
  }
}

export async function updateChallengeForm(
  problemId: number,
  challengeForm: CheckoutFormState
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  const existingProblem = await db.query.problems.findFirst({
    where: (s, { eq: _eq }) => _eq(s.id, problemId),
  });
  if (!existingProblem) {
    return { success: false, error: "Problem not found", status: 404 };
  }
  if (existingProblem.userId !== session.user.id) {
    return { success: false, error: "Forbidden", status: 403 };
  }
  if (challengeForm.details.title.trim() === "") {
    return {
      success: false,
      error: "Title in challenge form is required.",
      status: 400,
    };
  }
  if (challengeForm.details.description.trim() === "") {
    return {
      success: false,
      error: "Description in challenge form is required.",
      status: 400,
    };
  }
  if (!["Easy", "Medium", "Hard"].includes(challengeForm.details.difficulty)) {
    return {
      success: false,
      error: "Difficulty in challenge form is invalid.",
      status: 400,
    };
  }

  try {
    await db
      .update(problems)
      .set({
        title: challengeForm.details.title,
        description: challengeForm.details.description,
        difficulty: challengeForm.details.difficulty,
        testAlias: challengeForm.testContainer.alias,
        selectedTestPath: Object.keys(challengeForm.testContainer.testFiles),
        testBuildCommand: challengeForm.testContainer.buildCommand,
        testEntryCommand: challengeForm.testContainer.entryCommand,
        testEnvs: challengeForm.testContainer.envs,
        submissionBuildCommand: challengeForm.submission.buildCommand,
        submissionEntryCommand: challengeForm.submission.entryCommand,
        globalEnvs: challengeForm.submission.globalEnvs,
        replicaConfigs: Object.values(challengeForm.submission.replicaConfigs),
        isPublished: true,
      })
      .where(eq(problems.id, problemId));
    return {
      success: true,
      message: "Challenge form updated successfully.",
      status: 200,
    };
  } catch (err) {
    return {
      success: false,
      error: `An internal server error occurred. ${String(err)}`,
      status: 500,
    };
  }
}

export async function deleteProblem(id: number): Promise<ApiResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  const userId = await getUserById(session.user.id);
  if (!userId) {
    return { success: false, error: "User not found", status: 404 };
  }

  if (!Number.isInteger(id)) {
    return { success: false, error: "Problem ID is required", status: 400 };
  }

  const existingProblem = await db.query.problems.findFirst({
    where: (s, { eq: _eq }) => _eq(s.id, id),
  });
  if (!existingProblem) {
    return { success: false, error: "Problem not found", status: 404 };
  }
  if (existingProblem.userId !== session.user.id) {
    return { success: false, error: "Forbidden", status: 403 };
  }

  try {
    await db.delete(problems).where(eq(problems.id, id));
    return {
      success: true,
      message: "Problem deleted successfully.",
      status: 200,
    };
  } catch (err) {
    return {
      success: false,
      error: `An internal server error occurred. ${String(err)}`,
      status: 500,
    };
  }
}
