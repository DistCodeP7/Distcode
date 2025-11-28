"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className={"hover:cursor-pointer"}
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
