"use client";
import { deleteProblemFromList } from "@/app/authorized/[id]/listActions";
import ProblemListPageComponent from "./ProblemListPageComponent";
import type { Problem } from "@/lib/problems";
import { useState } from "react";

interface ClientProblemListPageProps {
  submissions: Problem[];
}

export default function ClientProblemListPage({ submissions }: ClientProblemListPageProps) {
  const [problems, setProblems] = useState(submissions);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      await deleteProblemFromList(id);
      // Remove item from local state immediately
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete problem:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <ProblemListPageComponent
      submissions={problems}
      onDelete={handleDelete}
      deletingId={isDeleting}
    />
  );
}
