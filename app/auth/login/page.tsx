import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/exercises");
  }
  return <LoginClient />;
}
