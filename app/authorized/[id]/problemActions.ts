"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { uniqueNamesGenerator } from "unique-names-generator";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { problems } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";
import type { CheckoutFormState } from "@/types/challenge";
import type {
  ActionResult,
  NewProblem,
  SaveProblemParams,
} from "@/types/problemTypes";
import { customConfig } from "@/utils/randomName";
import { checkUserCode } from "@/utils/validateCode";

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
      return { success: false, error: "Exercise not found", status: 404 };
    }
    if (existingProblem.userId !== session.user.id) {
      return { success: false, error: "Forbidden", status: 403 };
    }
  }

  const dataToValidate = { ...existingProblem, ...problemData };
  const fieldsToValidate = [
    { value: dataToValidate.problemMarkdown, name: "Problem markdown" },
    { value: dataToValidate.studentCode, name: "Student code" },
    { value: dataToValidate.solutionMarkdown, name: "Solution markdown" },
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
      const codeErrors = await checkUserCode(field.value);
      if (codeErrors) {
        return {
          success: false,
          error: `${field.name} validation errors: ${codeErrors.join(", ")}`,
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
          lastModified: new Date(),
        })
        .where(eq(problems.id, id));
    } else {
      const result = await db
        .insert(problems)
        .values({
          userId: session.user.id,
          problemMarkdown: problemData.problemMarkdown,
          studentCode: problemData.studentCode,
          solutionMarkdown: problemData.solutionMarkdown,
          protocolCode: problemData.protocolCode,
          testCode: problemData.testCode,
          isPublished: false,
          title: "",
          description: "",
          difficulty: "",
          testAlias: "test-container",
          selectedTestPath: [],
          testBuildCommand: "go test -c -o ./test_binary ./test/",
          testEntryCommand: "./test_binary",
          testEnvs: [],
          submissionBuildCommand: "go build -o ./stud ./student/main.go",
          submissionEntryCommand: "./wrapper -cmd ./stud",
          globalEnvs: [],
          replicaConfigs: [
            { alias: uniqueNamesGenerator(customConfig), envs: [] },
          ],
          timeout: 60,
          lastModified: new Date(),
        } as NewProblem)
        .returning();
      exerciseId = result[0].id;
    }

    return {
      success: true,
      message: isPublished
        ? "Exercise published successfully!"
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
    return { success: false, error: "Exercise not found", status: 404 };
  }
  if (existingProblem.userId !== session.user.id) {
    return { success: false, error: "Forbidden", status: 403 };
  }
  if (challengeForm.details.title.trim() === "") {
    return {
      success: false,
      error: "Title in exercise form is required.",
      status: 400,
    };
  }
  if (challengeForm.details.description.trim() === "") {
    return {
      success: false,
      error: "Description in exercise form is required.",
      status: 400,
    };
  }
  if (!["Easy", "Medium", "Hard"].includes(challengeForm.details.difficulty)) {
    return {
      success: false,
      error: "Difficulty in exercise form is invalid.",
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
        timeout: challengeForm.details.timeout,
        isPublished: true,
      })
      .where(eq(problems.id, problemId));
    return {
      success: true,
      message: "Exercise form updated successfully.",
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

export async function deleteProblem(id: number): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  const userId = await getUserById(session.user.id);
  if (!userId) {
    return { success: false, error: "User not found", status: 404 };
  }

  if (!Number.isInteger(id)) {
    return { success: false, error: "Exercise ID is required", status: 400 };
  }

  const existingProblem = await db.query.problems.findFirst({
    where: (s, { eq: _eq }) => _eq(s.id, id),
  });
  if (!existingProblem) {
    return { success: false, error: "Exercise not found", status: 404 };
  }
  if (existingProblem.userId !== session.user.id) {
    return { success: false, error: "Forbidden", status: 403 };
  }

  try {
    await db.delete(problems).where(eq(problems.id, id));
    return {
      success: true,
      message: "Exercise deleted successfully.",
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
