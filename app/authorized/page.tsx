import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProblemsByUserId } from "@/lib/problems";
import ClientProblemListPage from "./ClientProblemListPage";

export default async function ProblemListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Your Problems</h1>
        <p className="mt-4 text-muted-foreground">
          You must be signed in to view or create exercises.
        </p>
      </div>
    );
  }

  const submissions = await getProblemsByUserId(session.user.id);
  
  return <ClientProblemListPage submissions={submissions} />;
}
