"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveProblem } from "@/app/authorized/[id]/problemActions";
import {
  buildExercisePayload,
  getDefaultFileContent,
  normalizeFilePath,
} from "@/components/custom/problem/problemHelper";
import type { Filemap } from "@/types/actionTypes";

export const useProblemEditor = (
  initialFiles: Filemap,
  config?: { problemId?: number }
) => {
  const router = useRouter();

  const [state, setState] = useState(() => ({
    filesContent: { ...initialFiles },
    activeFile: Object.keys(initialFiles)[0],
    isSubmitting: false,
  }));

  const [lastMarkdownFile, setLastMarkdownFile] = useState(
    Object.keys(initialFiles).find((f) => f.endsWith(".md")) || "problem.md"
  );

  const setActiveFile = (file: string) => {
    setState((prev) => ({ ...prev, activeFile: file }));
    if (file.endsWith(".md")) setLastMarkdownFile(file);
  };

  const updateFileContent = (value: string | ((v: string) => string)) => {
    setState((prev) => {
      const active = prev.activeFile;
      if (!active) return prev;

      const newValue =
        typeof value === "function" ? value(prev.filesContent[active]) : value;

      return {
        ...prev,
        filesContent: { ...prev.filesContent, [active]: newValue },
      };
    });
  };

  const createFile = (filePath: string, parent?: string) => {
    setState((prev) => {
      const fullPath = normalizeFilePath(
        parent ? `${parent}/${filePath}` : filePath
      );

      if (prev.filesContent[fullPath]) {
        toast.error("File already exists");
        return prev;
      }

      return {
        ...prev,
        filesContent: {
          ...prev.filesContent,
          [fullPath]: getDefaultFileContent(fullPath),
        },
        activeFile: fullPath,
      };
    });
  };

  const deleteFile = (filePath: string) => {
    if (!state.filesContent[filePath]) return;

    const { [filePath]: _, ...newFiles } = state.filesContent;
    const newActive =
      state.activeFile === filePath
        ? Object.keys(newFiles)[0]
        : state.activeFile;

    setState({ ...state, filesContent: newFiles, activeFile: newActive });
    toast.success(`Deleted ${filePath}`);
  };

  const submit = async (isPublished: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const result = buildExercisePayload(
        state.filesContent,
        config?.problemId,
        isPublished
      );

      if (!result.success) {
        toast.error(`Missing fields: ${result.missing.join(", ")}`);
        return;
      }

      const response = await saveProblem(result.payload);

      if (response.success) {
        if (isPublished) router.push(`/authorized/checkout/?id=${response.id}`);
        else toast.success("Exercise saved successfully.");
      } else {
        toast.error(response.error || "Failed to save exercise");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    ...state,
    lastMarkdownFile,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    save: () => submit(false),
    submit: () => submit(true),
  };
};
