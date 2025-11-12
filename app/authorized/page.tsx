import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserIdByEmail } from "@/lib/user";
import { getProblemsByUserId } from "@/lib/problems";
import { Button } from "@/components/ui/button";
import NeonLines from "@/components/custom/NeonLine";
import { deleteProblemFromList } from "@/app/authorized/[id]/listActions";
import { DeleteButton } from "@/app/authorized/deleteButton";

export default async function ProblemListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Your Problems</h1>
        <p className="mt-4 text-muted-foreground">
          You must be signed in to view or create exercises.
        </p>
      </div>
    );
  }

  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold">Your Problems</h1>
        <p className="mt-4 text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const submissions = await getProblemsByUserId(userId);

  return (
    <div className="relative w-full min-h-screen py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <NeonLines count={80} />
      </div>

      <div className="container mx-auto flex flex-col gap-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-center sm:text-left text-foreground">
          Your Contributions
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-3xl text-center sm:text-left">
          Drafts and published exercises you can edit.
        </p>
        <div className="flex justify-end">
          <Link href="/authorized/newProblem">
            <Button>Create new exercise</Button>
          </Link>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-md border p-6">
            <p className="text-muted-foreground">
              You don't have any exercises yet.
            </p>
            <div className="mt-4">
              <Link href="/authorized/newProblem">
                <Button>Create your first exercise</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="rounded-md border p-6 flex flex-col gap-3 bg-background shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-xl font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap"
                      title={s.title}
                    >
                      {s.title}
                    </h2>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                      s.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {s.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <div
                  className="text-sm text-muted-foreground max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                  title={s.description}
                >
                  {s.description || (
                    <span className="italic text-muted-foreground">
                      No description
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Difficulty:</span>
                    <span
                      className={
                        s.difficulty === 1
                          ? "text-chart-2"
                          : s.difficulty === 2
                            ? "text-chart-3"
                            : "text-primary"
                      }
                    >
                      {s.difficulty === 1
                        ? "Easy"
                        : s.difficulty === 2
                          ? "Medium"
                          : "Hard"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Rating:</span>
                    <span className="font-semibold text-foreground">
                      {s.rating === null ? "Unrated" : s.rating}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <Link href={`/authorized/${s.id}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                  <Link href={`/exercises/${s.id}`}>
                    <Button size="sm" variant="ghost">
                      Open
                    </Button>
                  </Link>

                  {/* Delete */}
                  <form action={deleteProblemFromList.bind(null, s.id)}>
                    <DeleteButton />
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
