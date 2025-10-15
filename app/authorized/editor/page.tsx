import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";
import { getSubmissionsByUserId } from "@/lib/submission";
import { Button } from "@/components/ui/button";

export default async function EditorIndexPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Create Exercises</h1>
        <p className="mt-4 text-muted-foreground">You must be signed in to view or create exercises.</p>
        <div className="mt-6">
          <Link href="/auth/signin">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Create Exercises</h1>
        <p className="mt-4 text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const submissions = await getSubmissionsByUserId(userId);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Exercises</h1>
          <p className="mt-1 text-muted-foreground">Your written exercises (drafts and published). Create a new problem or edit existing ones.</p>
        </div>
        <div>
          <Link href="/authorized/editor/problem">
            <Button>Create new exercise</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {submissions.length === 0 ? (
          <div className="rounded-md border p-6">
            <p className="text-muted-foreground">You don't have any exercises yet.</p>
            <div className="mt-4">
              <Link href="/authorized/editor/problem">
                <Button>Create your first exercise</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Difficulty</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.title}</td>
                    <td className="p-3">{s.isPublished ? "Published" : "Draft"}</td>
                    <td className="p-3">{s.difficulty}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/authorized/editor/problem/${s.id}`}>
                          <Button size="sm">Edit</Button>
                        </Link>
                        <Link href={`/exercises/${s.id}`}>
                          <Button size="sm" variant="ghost">Open</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

