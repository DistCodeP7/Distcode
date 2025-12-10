"use client";

import { type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { resetCode, saveCode } from "@/app/exercises/[id]/actions";
import type { UseExerciseFilesArgs } from "@/app/exercises/[id]/components/editorProps";
import type { Filemap } from "@/types/actionTypes";

type File = {
  content: Filemap;
  order: string[];
  active: string;
};

type Reset = {
  resetting: boolean;
  showResetDialog: boolean;
};

export function useExerciseFiles({
  exerciseId,
  initialContents,
  studentCode,
  onBeforeSave,
}: UseExerciseFilesArgs) {
  const initialOrder = Object.keys(initialContents);

  const [file, setFile] = useState<File>({
    content: initialContents,
    order: initialOrder,
    active: initialOrder[0] || "",
  });

  const [reset, setReset] = useState<Reset>({
    resetting: false,
    showResetDialog: false,
  });
  const onCreateFile = (filename: string, parentPath = "student") => {
    if (filename.includes("main.go")) {
      toast.error("Cannot create a file named main.go");
      return;
    }

    const namePart = filename.startsWith("/") ? filename.slice(1) : filename;
    const withExt = namePart.includes(".") ? namePart : `${namePart}.go`;
    const fullPath = `${parentPath}/${withExt}`;

    setFile((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [fullPath]: `// New file: ${withExt}`,
      },
      order: [...prev.order, fullPath],
      active: fullPath,
    }));
  };

  const onDeleteFile = (path: string) => {
    if (path.includes("student/main.go")) {
      toast.error("Cannot delete the main.go file.");
      return;
    }

    setFile((prev) => {
      const newOrder = prev.order.filter((p) => p !== path);
      const newContent = { ...prev.content };
      delete newContent[path];

      let newActive = prev.active;
      if (prev.active === path) {
        const index = prev.order.indexOf(path);
        const newIndex = Math.max(0, index - 1);
        newActive = newOrder[newIndex] || "";
      }

      return {
        ...prev,
        content: newContent,
        order: newOrder,
        active: newActive,
      };
    });
  };

  const onSave = async () => {
    if (onBeforeSave) onBeforeSave();

    const saveMap: Filemap = {};
    file.order.forEach((p) => {
      saveMap[p] = file.content[p] ?? "";
    });

    const result = await saveCode(saveMap, { params: { id: exerciseId } });
    if (result.error) {
      toast.error(`Error saving code: ${result.error}`);
    } else {
      toast.success("Code saved successfully!");
    }
  };

  const onReset = () =>
    setReset((prev) => ({ ...prev, showResetDialog: true }));

  const confirmReset = async () => {
    setReset((prev) => ({ ...prev, showResetDialog: false, resetting: true }));
    try {
      const result = await resetCode({ params: { id: exerciseId } });
      if (result.success) {
        const newOrder = Object.keys(studentCode);
        setFile({
          content: { ...studentCode },
          order: newOrder,
          active: newOrder[0] || "",
        });
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
      setReset((prev) => ({ ...prev, resetting: false }));
    }
  };

  function setEditorContent(value: SetStateAction<string>): void {
    if (reset.resetting) return;
    setFile((prev) => {
      const currentPath = prev.active;
      const currentVal = prev.content[currentPath] ?? "";
      const newVal = typeof value === "function" ? value(currentVal) : value;
      return {
        ...prev,
        content: { ...prev.content, [currentPath]: newVal },
      };
    });
  }

  return {
    file,
    setFile,
    reset,
    setReset,
    onCreateFile,
    onDeleteFile,
    onSave,
    onReset,
    confirmReset,
    setEditorContent,
  };
}
