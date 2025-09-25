"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { submitSubmission } from "@/lib/submission";
import { getUserIdByEmail } from "@/lib/user";

export async function submitProblem({
  title,
  description,
  difficulty,
  rating = 0,
  problemMarkdown,
  templateCode,
  solutionCode,
  testCasesCode,
}: {
  title: string;
  description: string;
  difficulty: number;
  rating: number;
  problemMarkdown: string;
  templateCode: string;
  solutionCode: string;
  testCasesCode: string;
}) {
  const fieldsToValidate = [
    { value: title, name: "Title" },
    { value: description, name: "Description" },
    { value: problemMarkdown, name: "Problem markdown" },
    { value: templateCode, name: "Template code" },
    { value: solutionCode, name: "Solution code" },
    { value: testCasesCode, name: "Test cases code" },
  ];

  for (const field of fieldsToValidate) {
    if (!field.value || typeof field.value !== "string") {
      return {
        success: false,
        error: `${field.name} is required`,
        status: 400,
      };
    }
  }
  if (typeof difficulty !== "number" || Number.isNaN(difficulty)) {
    return {
      success: false,
      error: `Difficulty must be selected`,
      status: 400,
    };
  }
  if (difficulty < 1 || difficulty > 3) {
    return {
      success: false,
      error: `Difficulty must be a number between 1 and 3`,
      status: 400,
    };
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return {
        success: false,
        error: "Not authenticated",
        status: 401,
      };
    }

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId) {
      return {
        success: false,
        error: "User not found",
        status: 404,
      };
    }

    await submitSubmission(
      userId,
      title,
      description,
      difficulty,
      rating,
      problemMarkdown,
      templateCode,
      solutionCode,
      testCasesCode
    );

    return {
      success: true,
      message: "Problem submitted successfully!",
      status: 200,
    };
  } catch (_err) {
    return {
      success: false,
      error: "An internal server error occurred.",
      status: 500,
    };
  }
}
