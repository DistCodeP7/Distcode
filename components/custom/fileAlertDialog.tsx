"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";

interface FileAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (filename: string) => void;
  onDelete?: () => void;
  defaultName?: string;
}

export function FileAlertDialog({
  open,
  onOpenChange,
  onCreate,
  onDelete,
  defaultName = "",
}: FileAlertDialogProps) {
  // Use an uncontrolled input to avoid useEffect usage.
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function handleCreate() {
    const value = (inputRef.current?.value || "").trim();
    if (!value) return;
    if (!onCreate) return;
    onCreate(value);
    onOpenChange(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {onCreate && (
            <>
              <AlertDialogTitle>Create new file / folder</AlertDialogTitle>
              <AlertDialogDescription>Enter a file</AlertDialogDescription>
            </>
          )}
          {onDelete && (
            <>
              <AlertDialogTitle>Delete file {defaultName}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this file? This action cannot be
                undone.
              </AlertDialogDescription>
            </>
          )}
        </AlertDialogHeader>
        {onCreate && (
          <div className="pt-2">
            <Input
              ref={inputRef}
              defaultValue={defaultName}
              autoFocus
              placeholder="e.g. example.go"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {onCreate && (
            <AlertDialogAction onClick={handleCreate}>Create</AlertDialogAction>
          )}
          {onDelete && (
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
            >
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default FileAlertDialog;
