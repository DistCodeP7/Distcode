"use client";

import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { deleteProblemFromList } from "@/app/authorized/[id]/listActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function DeleteButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDelete() {
    try {
      setIsLoading(true);
      await deleteProblemFromList(id);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        size="lg"
        variant="destructive"
        className="absolute bottom-0 right-0 hover:cursor-pointer pointer-events-auto"
        onClick={() => setOpen(true)}
      >
        <TrashIcon className="w-4 h-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              exercise.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isLoading}
              className="hover:cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80 hover:cursor-pointer transition-colors"
              disabled={isLoading}
              onClick={handleDelete}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
