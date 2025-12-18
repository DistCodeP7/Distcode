"use client";
import { FolderOpen, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteProblemFromList } from "@/app/authorized/[id]/listActions";
import { ConfirmDialog } from "@/components/custom/confirmDialog";
import NeonLines from "@/components/custom/neonLine";
import { Button } from "@/components/ui/button";
import type { Problem } from "@/lib/problems";

interface ProblemListClientProps {
  exercises: Problem[];
}

export default function ProblemListClient({
  exercises: initialExercises,
}: ProblemListClientProps) {
  const [exercises, setExercises] = useState<Problem[]>(initialExercises);
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteProblemFromList(id);
      setExercises((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete problem:", error);
    } finally {
      setOpenDialogId(null);
    }
  };

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
        {exercises.length === 0 ? (
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
            {exercises.map((e) => (
              <div
                key={e.id}
                className="relative rounded-md border p-6 bg-background shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all duration-200"
              >
                <Link
                  href={`/authorized/${e.id}`}
                  className="absolute inset-0 z-0"
                />
                <div className="relative z-10 flex flex-col gap-3 pointer-events-none">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-xl font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap"
                        title={e.title}
                      >
                        {e.title}
                      </h2>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                        e.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {e.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div
                    className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap"
                    title={e.description}
                  >
                    {e.description || (
                      <span className="italic text-muted-foreground">
                        No description
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="italic text-muted-foreground">
                      Last modified at:
                      {e.lastModified instanceof Date
                        ? e.lastModified.toLocaleString()
                        : e.lastModified}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>Difficulty:</span>
                      <span
                        className={
                          e.difficulty === "Easy"
                            ? "text-chart-2"
                            : e.difficulty === "Medium"
                              ? "text-chart-3"
                              : "text-primary"
                        }
                      >
                        {e.difficulty ?? "Easy"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 z-20">
                    <Link
                      href={`/exercises/${e.id}`}
                      className="pointer-events-auto"
                    >
                      <Button
                        size="lg"
                        variant="secondary"
                        className="hover:cursor-pointer"
                      >
                        View Exercise
                        <FolderOpen className="w-4 h-4 scale-120" />
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="hover:cursor-pointer absolute bottom-0 right-0 pointer-events-auto"
                      onClick={() => setOpenDialogId(e.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                    <ConfirmDialog
                      open={openDialogId === e.id}
                      onOpenChange={(open: boolean) =>
                        setOpenDialogId(open ? e.id : null)
                      }
                      title="Delete Exercise"
                      description="Are you sure you want to delete this exercise? This action cannot be undone."
                      confirmLabel="Delete"
                      cancelLabel="Cancel"
                      onConfirm={async () => {
                        handleDelete(e.id);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
