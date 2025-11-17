"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { problems } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";

export type ApiResult =
  | { success: true; message: string; status: number }
  | { success: false; error: string; status: number };

export type SaveProblemParams = {
  id?: number;
  title: string;
  description: string;
  difficulty: number;
  problemMarkdown: string;
  templateCode: string[];
  solutionCode: string[];
  testCasesCode: string;
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
    { value: dataToValidate.title, name: "Title" },
    { value: dataToValidate.description, name: "Description" },
    { value: dataToValidate.problemMarkdown, name: "Problem markdown" },
    { value: dataToValidate.templateCode, name: "Template code" },
    { value: dataToValidate.solutionCode, name: "Solution code" },
    { value: dataToValidate.testCasesCode, name: "Test cases code" },
  ];
  for (const field of fieldsToValidate) {
    const isArrayField =
      field.name.includes("Template") || field.name.includes("Solution");
    if (!field.value) {
      return {
        success: false,
        error: `${field.name} is required (missing).`,
        status: 400,
      };
    }
    if (isArrayField) {
      if (!Array.isArray(field.value) || field.value.length === 0) {
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

  try {
    if (id) {
      await db
        .update(problems)
        .set({ ...problemData, isPublished })
        .where(eq(problems.id, id));
    } else {
      await db
        .insert(problems)
        .values({ ...problemData, userId: session.user.id, isPublished });
    }

    return {
      success: true,
      message: isPublished
        ? "Problem published successfully!"
        : "Draft saved successfully.",
      status: 200,
    };
  } catch (err) {
    return {
      success: false,
      error: `An internal server error occurred.${err}`,
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
