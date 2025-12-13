"use client";

import { Save, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type EditorActionsProps = {
  onSave: () => void;
  onSubmit: () => void;
  onCancelTests: () => void;
  onReset: () => void;
  hasActiveJob: boolean;
  resetting: boolean;
  canRate: boolean;
  onRate: (bool: boolean) => void;
};

export function EditorActions({
  onSave,
  onSubmit,
  onCancelTests,
  onReset,
  hasActiveJob,
  resetting,
  canRate,
  onRate,
}: EditorActionsProps) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon" // A common size prop for icon-only buttons
        onClick={() => onRate(true)}
        disabled={canRate}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onRate(false)}
        disabled={canRate}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
        onClick={onSave}
        disabled={resetting}
      >
        <Save className="w-4 h-4" /> Save
      </Button>

      {hasActiveJob ? (
        <Button
          onClick={onCancelTests}
          type="button"
          variant="destructive"
          className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
          disabled={resetting}
        >
          <X className="w-4 h-4" />
          Cancel Tests
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          type="button"
          variant="outline"
          className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
          disabled={resetting}
        >
          <Send className="w-4 h-4" />
          Submit
        </Button>
      )}

      <Button
        onClick={onReset}
        type="button"
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
        disabled={resetting}
      >
        <Send className="w-4 h-4" /> Reset Code
      </Button>
    </>
  );
}
