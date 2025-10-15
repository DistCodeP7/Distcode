"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";
import { db } from "@/lib/db";
import { submissions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

type SaveProblemParams = {
  id?: number; // If present, it's an update
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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Not authenticated", status: 401 };
    }
    const userId = await getUserIdByEmail(session.user.email);
    if (!userId) {
      return { success: false, error: "User not found", status: 404 };
    }

    const { id, isPublished = false, ...problemData } = data;
    let existingProblem = null;

    if (id) {
      existingProblem = await db.query.submissions.findFirst({
        where: (s, { eq: _eq }) => _eq(s.id, id),
      });
      if (!existingProblem) {
        return { success: false, error: "Problem not found", status: 404 };
      }
      if (existingProblem.userId !== userId) {
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
      if (field.value === undefined || field.value === null) {
        return {
          success: false,
          error: `${field.name} is required (missing).`,
          status: 400,
        };
      }
      // For publish, require non-empty; for draft, allow empty
      if (isPublished) {
        if (isArrayField) {
          if (!Array.isArray(field.value) || field.value.length === 0) {
            return {
              success: false,
              error: `${field.name} is required (empty).`,
              status: 400,
            };
          }
        } else if (
          typeof field.value === "string" &&
          field.value.trim() === ""
        ) {
          return {
            success: false,
            error: `${field.name} is required (empty).`,
            status: 400,
          };
        }
      }
    }
    if (dataToValidate.difficulty < 1 || dataToValidate.difficulty > 3) {
      return {
        success: false,
        error: "Difficulty must be selected.",
        status: 400,
      };
    }

    if (id) {
      await db
        .update(submissions)
        .set({ ...problemData, isPublished })
        .where(eq(submissions.id, id));
    } else {
      await db
        .insert(submissions)
        .values({ ...problemData, userId, isPublished, rating: 0 });
    }

    return {
      success: true,
      message: isPublished
        ? "Problem published successfully!"
        : "Draft saved successfully.",
      status: 200,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: "An internal server error occurred.",
      status: 500,
    };
  }
}
