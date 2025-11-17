import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/exercises");
  }
  return <LoginClient />;
}
