"use server";

import { submitSubmission } from "@/lib/submission";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";

export async function submitProblem({
  title,
  markdown,
}: {
  title: string;
  markdown: string;
}) {
  if (!title || typeof title !== "string") {
    return { success: false, error: "Title is required" };
  }
  if (!markdown || typeof markdown !== "string") {
    return { success: false, error: "Markdown is required" };
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = await getUserIdByEmail(session.user.email);
    if (!userId) {
      return { success: false, error: "User not found" };
    }

    await submitSubmission(userId, title, markdown);
    return { success: true, message: "Problem submitted successfully!" };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to submit problem" };
  }
}