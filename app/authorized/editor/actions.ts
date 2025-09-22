"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";
import { getServerSession } from "next-auth";

export async function submitCode(content: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return { error: "User not found.", status: 404 };
  }

  console.log(userId, content);

  return {
    success: true,
    message: "Code submitted successfully",
  };
}
