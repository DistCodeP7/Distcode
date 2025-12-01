"use client";

import { useRouter } from "next/navigation";
import { type SetStateAction, useCallback, useState } from "react";
import { saveProblem } from "@/app/authorized/[id]/problemActions";
import type { CheckoutFormState } from "@/app/authorized/checkout/challenge";
import type { Paths } from "@/drizzle/schema";

const getInitialContent = (path: string): string => {
  if (
    path.endsWith(".md") ||
    path.startsWith("problem") ||
    path.startsWith("solution")
  ) {
    if (path.startsWith("problem"))
      return "# Problem Description\n\nDescribe the problem here.\n";
    if (path.startsWith("solution"))
      return "# Solution Explanation\n\nDescribe the solution here.\n";
    return "";
  }

  if (
    path.endsWith(".go") ||
    path.startsWith("/student") ||
    path.startsWith("/test") ||
    path === "protocol.go"
  ) {
    if (path.startsWith("/student")) return "// Write your code here\n";
    if (path.startsWith("/test")) return "// Write your test cases here\n";
    if (path === "protocol.go")
      return `package main

// Define any shared protocols or interfaces here
`;
    return "";
  }

  return "";
};

type ActionResult =
  | { success: true; message?: string; status?: number; id?: number }
  | { success: false; error?: string; status?: number };

type ProblemEditorState = {
  filesContent: Paths;
  activeFile: string;
  title: string;
  description: string;
  difficulty: string;
  isSubmitting: boolean;
};

export const useProblemEditor = (
  files: Paths,
  initial?: {
    filesContent?: Paths;
    title?: string;
    description?: string;
    difficulty?: string;
    problemId?: number;
  }
) => {
  const router = useRouter();

  const [state, setState] = useState<ProblemEditorState>(() => {
    const filesContent = initial?.filesContent
      ? { ...initial.filesContent }
      : Object.keys(files).reduce((acc, key) => {
          acc[key] = files[key] ?? getInitialContent(key);
          return acc;
        }, {} as Paths);

    return {
      filesContent,
      activeFile: Object.keys(files)[0] || "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      difficulty: initial?.difficulty ?? "1",
      isSubmitting: false,
    };
  });

  const syncFilesContent = useCallback(() => {
    setState((prev) => {
      const newFilesContent = Object.keys(files).reduce((acc, key) => {
        acc[key] =
          prev.filesContent[key] ?? files[key] ?? getInitialContent(key);
        return acc;
      }, {} as Paths);
      return { ...prev, filesContent: newFilesContent };
    });
  }, [files]);

  const handleEditorContentChange = useCallback(
    (value: SetStateAction<string>) => {
      setState((prev) => {
        const activeFileName = prev.activeFile;
        if (!activeFileName) return prev;
        const newContent =
          typeof value === "function"
            ? value(prev.filesContent[activeFileName])
            : value;
        return {
          ...prev,
          filesContent: { ...prev.filesContent, [activeFileName]: newContent },
        };
      });
    },
    []
  );

  const handleCreateFile = useCallback((filePath: string) => {
    setState((prev) => {
      const parentPath = filePath.includes("/") ? filePath : "/student";
      if (filePath.endsWith("/")) {
        const folderName = filePath.replace(/^\/+|\/+$/g, "");
        const placeholderPath = `${parentPath.replace(/\/+$/, "")}/${folderName}/placeholder.md`;
        const defaultContent = `// placeholder for ${folderName}`;
        return {
          ...prev,
          filesContent: {
            ...prev.filesContent,
            [placeholderPath]: defaultContent,
          },
          activeFile: placeholderPath,
        };
      }
      console.log("Creating file at path:", filePath);
      const isFullPath =
        filePath.includes("/") &&
        !filePath.startsWith("./") &&
        !filePath.startsWith("../");
      let fullPath = filePath;
      if (!isFullPath) {
        const namePart = filePath.startsWith("/")
          ? filePath.slice(1)
          : filePath;
        const withExt = namePart.includes(".") ? namePart : `${namePart}.go`;
        fullPath = `/${withExt}`;
      }

      const defaultContent = fullPath.endsWith(".md")
        ? ""
        : `// New file: ${fullPath.split("/").pop()}`;

      return {
        ...prev,
        filesContent: { ...prev.filesContent, [fullPath]: defaultContent },
        activeFile: fullPath,
      };
    });
  }, []);

  const handleDeleteFile = useCallback((filePath: string) => {
    setState((prev) => {
      const keys = Object.keys(prev.filesContent);
      if (keys.length <= 1) {
        alert("Cannot delete the last remaining file.");
        return prev;
      }

      const index = keys.indexOf(filePath);
      if (index === -1) return prev;

      if (
        filePath.includes("/student/main.go") ||
        filePath.endsWith("/student/main.go") ||
        (filePath.endsWith("main.go") && filePath.includes("/student")) ||
        filePath.includes("/test/test.go")
      ) {
        alert("Cannot delete the main.go file.");
        return prev;
      }

      const copy = { ...prev.filesContent };
      delete copy[filePath];

      let newActive = prev.activeFile;
      if (prev.activeFile === filePath) {
        const newKeys = Object.keys(copy);
        const newIndex = Math.max(0, index - 1);
        newActive = newKeys[newIndex] ?? newKeys[0] ?? "";
      }

      return { ...prev, filesContent: copy, activeFile: newActive };
    });
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setDifficulty = useCallback((difficulty: string) => {
    setState((prev) => ({ ...prev, difficulty }));
  }, []);

  const setActiveFile = useCallback((activeFile: string) => {
    setState((prev) => ({ ...prev, activeFile }));
  }, []);

  const handleSaveOrSubmit = useCallback(
    async (isPublished: boolean) => {
      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const missingFields: string[] = [];
        if (!state.title.trim()) missingFields.push("Title");
        if (!state.description.trim()) missingFields.push("Description");
        if (!["1", "2", "3"].includes(state.difficulty))
          missingFields.push("Difficulty");

        const problemKey = Object.keys(state.filesContent).find((k) => {
          const nn = k;
          return nn === "problem.md" || nn.startsWith("problem");
        });

        if (!problemKey || !state.filesContent[problemKey]?.trim())
          missingFields.push("Problem markdown");

        const problemMarkdown = problemKey
          ? state.filesContent[problemKey]
          : "";
        const keys = Object.keys(state.filesContent);
        const studentFiles = keys.filter((k) => k.startsWith("/student"));
        const solutionFiles = keys.filter((k) => k.startsWith("solution"));
        const studentCode = studentFiles.map(
          (k) => state.filesContent[k] || ""
        );
        const studentFilesMap = studentFiles.reduce((acc, k) => {
          acc[k] = state.filesContent[k] || "";
          return acc;
        }, {} as Paths);
        const solutionCode =
          solutionFiles.length > 0
            ? state.filesContent[solutionFiles[0]] || ""
            : "";

        const testFiles = keys.filter(
          (k) => k.startsWith("/test") || k.startsWith("test")
        );
        const testCode = testFiles.map((k) => state.filesContent[k] || "");
        const testFilesMap = testFiles.reduce((acc, k) => {
          acc[k] = state.filesContent[k] || "";
          return acc;
        }, {} as Paths);

        const protocolCode =
          keys
            .filter((k) => k === "protocol.go" || k.endsWith("/protocol.go"))
            .map((k) => state.filesContent[k] || "")[0] || "";

        if (!studentFiles.length || studentCode.some((c) => !c.trim()))
          missingFields.push("Student code");
        if (solutionFiles.length !== 1 || !solutionCode.trim())
          missingFields.push("Solution code");
        if (!testFiles.length || testCode.some((c) => !c.trim()))
          missingFields.push("Test code");

        if (missingFields.length > 0) {
          alert(`Missing or empty fields: ${missingFields.join(", ")}`);
          return;
        }

        const createForm: CheckoutFormState = {
          step: 1,
          details: {
            title: state.title,
            description: state.description,
            difficulty: state.difficulty as "Easy" | "Medium" | "Hard",
          },
          testContainer: {
            alias: "test-container",
            testFiles: testFilesMap,
            buildCommand: "go build -o /app/test /app/test/test.go",
            entryCommand: "/app/test",
            envs: [],
          },
          submission: {
            buildCommand: "go build -o /app/student /app/student/main.go",
            entryCommand: "/app/student",
            replicas: 1,
            globalEnvs: [],
            replicaConfigs: {
              0: { alias: "student-replica-1", envs: [] },
            },
          },
        };

        const payload = {
          id: initial?.problemId,
          title: state.title,
          description: state.description,
          difficulty: parseInt(state.difficulty, 10),
          problemMarkdown,
          studentCode: studentFilesMap,
          solutionCode,
          testCode: testFilesMap,
          protocolCode,
          isPublished,
          createForm,
        };

        const result: ActionResult = await saveProblem(payload);
        if (result.success) {
          const qs = `challengeForm=${encodeURIComponent(
            JSON.stringify(createForm)
          )}&id=${encodeURIComponent(String(result.id))}`;
          router.push(`/authorized/checkout/?${qs}`);
        }
      } catch (err) {
        alert(`An unexpected error occurred: ${err}`);
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [state, initial?.problemId, router]
  );

  const handleSubmit = useCallback(
    () => handleSaveOrSubmit(true),
    [handleSaveOrSubmit]
  );
  const handleSave = useCallback(
    () => handleSaveOrSubmit(false),
    [handleSaveOrSubmit]
  );

  return {
    ...state,
    setTitle,
    setDescription,
    setDifficulty,
    setActiveFile,
    handleEditorContentChange,
    handleSubmit,
    handleSave,
    handleCreateFile,
    handleDeleteFile,
    syncFilesContent,
  };
};
