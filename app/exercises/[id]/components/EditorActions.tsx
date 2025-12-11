"use client";

import { Save, Play, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type EditorActionsProps = {
  onSave: () => void;
  onSubmit: () => void;
  onCancelTests: () => void;
  onReset: () => void;
  hasActiveJob: boolean;
  resetting: boolean;
};

export function EditorActions({
  onSave,
  onSubmit,
  onCancelTests,
  onReset,
  hasActiveJob,
  resetting,
}: EditorActionsProps) {
  return (
    <>
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
          <Play className="w-4 h-4" />
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
        <RotateCcw className="w-4 h-4" /> Reset Code
      </Button>
    </>
  );
}
