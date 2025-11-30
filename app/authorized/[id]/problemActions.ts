"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { problems } from "@/drizzle/schema";
import type { Paths } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";
import type { CheckoutFormState } from "../checkout/challenge";

export type ApiResult =
  | { success: true; message: string; status: number }
  | { success: false; error: string; status: number };

export type SaveProblemParams = {
  id?: number;
  title: string;
  description: string;
  difficulty: number;
  problemMarkdown: string;
  studentCode: Paths;
  solutionCode: string;
  testCode: Paths;
  protocolCode?: string;
  isPublished?: boolean;
  createForm: CheckoutFormState;
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
    { value: dataToValidate.title, name: "Title" },
    { value: dataToValidate.description, name: "Description" },
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
      // Expect a map/object with at least one key
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
  if (dataToValidate.difficulty < 1 || dataToValidate.difficulty > 3) {
    return {
      success: false,
      error: "Difficulty must be selected.",
      status: 400,
    };
  }
  let exerciseId = id;
  try {
    if (id) {
      await db
        .update(problems)
        .set({
          ...problemData,
          isPublished,
        })
        .where(eq(problems.id, id));
    } else {
      const result = await db
        .insert(problems)
        .values({
          ...problemData,
          userId: session.user.id,
          isPublished,
          challengeForm: data.createForm,
          protocolCode: problemData.protocolCode ?? "",
        })
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

  try {
    await db
      .update(problems)
      .set({ challengeForm })
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
