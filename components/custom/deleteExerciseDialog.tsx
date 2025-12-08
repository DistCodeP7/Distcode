"use client";

import { TrashIcon } from "lucide-react";
import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteProblemFromList(id);
    });
  }

  return (
    <>
      <Button
        size="lg"
        variant="destructive"
        className="absolute bottom-6 right-6 hover:cursor-pointer"
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
              disabled={isPending}
              className="hover:cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80 hover:cursor-pointer transition-colors"
              disabled={isPending}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
