// app/authorized/[id]/problemActions.ts
"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { type nodeSpec, problems } from "@/drizzle/schema";
import { db } from "@/lib/db";
import { getUserById } from "@/lib/user";

export type SaveProblemParams = {
  id?: number;
  title: string;
  description: string;
  difficulty: number;
  problemMarkdown: string;
  templateCode: string[];
  solutionCode: string;
  testCode: string[];
  protocolCode?: string;
  isPublished?: boolean;
};

export async function saveProblem(data: SaveProblemParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  const { id, isPublished = false, ...problemData } = data;
  const existingProblem =
    id !== undefined
      ? await db.query.problems.findFirst({
          where: (s, { eq }) => eq(s.id, id),
        })
      : undefined;

  const filesObj = problemData.codeFolder.Files;

  const dataToValidate = { ...existingProblem, ...problemData };
  const fieldsToValidate = [
    { value: dataToValidate.title, name: "Title" },
    { value: dataToValidate.description, name: "Description" },
    { value: dataToValidate.problemMarkdown, name: "Problem markdown" },
    { value: dataToValidate.templateCode, name: "Template code" },
    { value: dataToValidate.solutionCode, name: "Solution code" },
    { value: dataToValidate.testCode, name: "Test code" },
  ];

  for (const field of fieldsToValidate) {
    const isArrayField =
      field.name.includes("Template") || field.name.includes("Test");
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
      error: "Code folder cannot be empty",
      status: 400,
    };
  }
  if (!("/solution/main.go" in filesObj)) {
    return { success: false, error: "Solution file is required", status: 400 };
  }
  if (!("/test/main.go" in filesObj)) {
    return { success: false, error: "Tests file is required", status: 400 };
  }
  if (!("/template/main.go" in filesObj)) {
    return { success: false, error: "Template file is required", status: 400 };
  }
  if (!("/proto/protocol.go" in filesObj)) {
    return { success: false, error: "Protocol file is required", status: 400 };
  }

  try {
    if (id) {
      await db
        .update(problems)
        .set({
          title: problemData.title,
          description: problemData.description,
          difficulty: problemData.difficulty,
          problemMarkdown: problemData.problemMarkdown,
          studentCode: problemData.templateCode,
          solutionCode: problemData.solutionCode,
          testCode: problemData.testCode,
          protocolCode:
            problemData.protocolCode ?? existingProblem?.protocolCode ?? "",
          isPublished,
        })
        .where(eq(problems.id, id));
    } else {
      await db.insert(problems).values({
        title: problemData.title,
        description: problemData.description,
        difficulty: problemData.difficulty,
        problemMarkdown: problemData.problemMarkdown,
        studentCode: problemData.templateCode,
        solutionCode: problemData.solutionCode,
        testCode: problemData.testCode,
        protocolCode: problemData.protocolCode ?? "",
        userId: session.user.id,
        isPublished,
      });
    }
    await db.insert(problems).values({
      difficulty: problemData.difficulty,
      description: problemData.description,
      title: problemData.title,
      problemMarkdown: problemData.problemMarkdown,
      codeFolder: {
        Files: filesObj,
        Envs: problemData.codeFolder.Envs,
        BuildCommand: problemData.codeFolder.BuildCommand,
        EntryCommand: problemData.codeFolder.EntryCommand,
      },
      isPublished,
      userId: user.userid,
    });

    return { success: true, message: "Problem created", status: 201 };
  }
}

export async function deleteProblem(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", status: 401 };
  }

  if (id <= 0 || Number.isNaN(id)) {
    return { success: false, error: "Problem ID is required", status: 400 };
  }

  const existingProblem = await db.query.problems.findFirst({
    where: (s, { eq }) => eq(s.id, id),
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
      message: "Problem deleted successfully",
      status: 200,
    };
  } catch (error: unknown) {
    console.error("Database error during problem deletion:", error);
    return {
      success: false,
      error: `Database error: ${error || "Unknown error"}`,
      status: 500,
    };
  }
}
