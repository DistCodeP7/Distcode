"use client";

import { type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { resetCode, saveCode } from "@/app/exercises/[id]/actions";
import type { Paths } from "@/drizzle/schema";

type UseExerciseFilesArgs = {
  exerciseId: number;
  initialContents: Paths;
  studentCode: Paths;
  onBeforeSave?: () => void;
};

export function useExerciseFiles({
  exerciseId,
  initialContents,
  studentCode,
  onBeforeSave,
}: UseExerciseFilesArgs) {
  const initialOrder = Object.keys(initialContents);

  const [fileContents, setFileContents] = useState<Paths>(initialContents);
  const [fileOrder, setFileOrder] = useState<string[]>(initialOrder);
  const [activeFile, setActiveFile] = useState<string>(initialOrder[0] || "");
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const onCreateFile = (filename: string, parentPath = "student") => {
    if (filename.includes("main.go")) {
      toast.error("Cannot create a file named main.go");
      return;
    }

    const namePart = filename.startsWith("/") ? filename.slice(1) : filename;
    const withExt = namePart.includes(".") ? namePart : `${namePart}.go`;
    const fullPath = `${parentPath}/${withExt}`;

    setFileContents((prev) => ({
      ...prev,
      [fullPath]: `// New file: ${withExt}`,
    }));

    setFileOrder((prev) => {
      const newOrder = [...prev, fullPath];
      setActiveFile(fullPath);
      return newOrder;
    });
  };

  const onDeleteFile = (path: string) => {
    if (path.includes("student/main.go")) {
      toast.error("Cannot delete the main.go file.");
      return;
    }

    const newOrder = fileOrder.filter((p) => p !== path);
    setFileOrder(newOrder);
    setFileContents((prev) => {
      const copy = { ...prev };
      delete copy[path];
      return copy;
    });

    if (activeFile === path) {
      const index = fileOrder.indexOf(path);
      const newIndex = Math.max(0, index - 1);
      setActiveFile(newOrder[newIndex] || "");
    }
  };

  const onSave = async () => {
    if (onBeforeSave) onBeforeSave();

    const saveMap: Paths = {};
    fileOrder.forEach((p) => {
      saveMap[p] = fileContents[p] ?? "";
    });

    const result = await saveCode(saveMap, { params: { id: exerciseId } });
    if (result.error) {
      toast.error(`Error saving code: ${result.error}`);
    } else {
      toast.success("Code saved successfully!");
    }
  };

  const onReset = () => setShowResetDialog(true);

  const confirmReset = async () => {
    setShowResetDialog(false);
    setResetting(true);
    try {
      const result = await resetCode({ params: { id: exerciseId } });
      if (result.success) {
        setFileContents({ ...studentCode });
        setFileOrder(Object.keys(studentCode));
        toast.success("Code reset successfully!", {
          description: "Template restored and saved code cleared.",
        });
      } else {
        toast.error("Failed to reset code", {
          description: result.error || "Something went wrong.",
        });
      }
    } catch (err) {
      toast.error("Error resetting code", { description: String(err) });
    } finally {
      setResetting(false);
    }
  };

  function setEditorContent(value: SetStateAction<string>): void {
    if (resetting) return;
    setFileContents((prev) => {
      const currentPath = activeFile;
      const currentVal = prev[currentPath] ?? "";
      const newVal = typeof value === "function" ? value(currentVal) : value;
      return { ...prev, [currentPath]: newVal };
    });
  }

  return {
    fileContents,
    fileOrder,
    activeFile,
    setActiveFile,
    resetting,
    showResetDialog,
    setShowResetDialog,
    onCreateFile,
    onDeleteFile,
    onSave,
    onReset,
    confirmReset,
    setEditorContent,
  };
}
