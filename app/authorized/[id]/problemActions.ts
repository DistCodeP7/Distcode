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

  const files = problemData.codeFolder.files;
  if (files.size === 0) {
    return {
      success: false,
      error: "Code folder cannot be empty",
      status: 400,
    };
  }
  if (!files.has("/solution/main.go")) {
    return { success: false, error: "Solution file is required", status: 400 };
  }
  if (!files.has("/tests/tests.go")) {
    return { success: false, error: "Tests file is required", status: 400 };
  }
  if (!files.has("/template/main.go")) {
    return { success: false, error: "Template file is required", status: 400 };
  }

  if (!files.has("/proto/protocol.go")) {
    return { success: false, error: "Protocol file is required", status: 400 };
  }

  if (existingProblem) {
    await db
      .update(problems)
      .set({ ...problemData, isPublished })
      .where(eq(problems.id, existingProblem.id));
    return { success: true, message: "Problem updated", status: 200 };
  } else {
    const user = await getUserById(session.user.id);
    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    await db.insert(problems).values({
      ...problemData,
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

  const existingProblem = await db.query.problems.findFirst({
    where: (s, { eq }) => eq(s.id, id),
  });
  if (!existingProblem) {
    return { success: false, error: "Problem not found", status: 404 };
  }

  await db.delete(problems).where(eq(problems.id, id));
  return { success: true, message: "Problem deleted", status: 200 };
}
