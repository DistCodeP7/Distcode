"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      size="sm"
      variant="destructive"
      type="submit"
      onClick={(e) => {
        if (!confirm("Delete this exercise? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
      disabled={pending}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
