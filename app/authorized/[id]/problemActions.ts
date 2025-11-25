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
  codeFolder: nodeSpec;
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

  if (Object.keys(filesObj).length === 0) {
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

  if (existingProblem) {
    await db
      .update(problems)
      .set({
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
      })
      .where(eq(problems.id, existingProblem.id));
    return { success: true, message: "Problem updated", status: 200 };
  } else {
    const user = await getUserById(session.user.id);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
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
