"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MQJobsSender } from "@/lib/mq";
import { getUserIdByEmail } from "@/lib/user";

export async function submitCode(content: string) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return { error: "User not found.", status: 404 };
  }

  MQJobsSender.sendMessage({
    //TODO MAKE THIS A VARIABLE
    ProblemId: 0,
    UserId: userId,
    Code: content,
    Timeoutlimit: 60,
  });

  return {
    success: true,
    message: "Code submitted successfully",
  };
}
