"use client";

import { type SetStateAction, useCallback, useState } from "react";
import { saveProblem } from "@/app/authorized/[id]/problemActions";
import type { CheckoutFormState } from "@/app/authorized/checkout/challenge";
import { useRouter } from "next/navigation";

type ProblemFile = {
  name: string;
  fileType: "markdown" | "go";
};

const getInitialContent = (file: ProblemFile): string => {
  if (file.fileType === "markdown") {
    const name = file.name.startsWith("/") ? file.name.slice(1) : file.name;
    if (name.startsWith("problem"))
      return "# Problem Description\n\nDescribe the problem here.\n";
    if (name.startsWith("solution"))
      return "# Solution Explanation\n\nDescribe the solution here.\n";
  }

  if (file.fileType === "go") {
    // Normalize names so we accept both "test" and "/test" style prefixes
    const name = file.name.startsWith("/") ? file.name.slice(1) : file.name;
    if (name.startsWith("student")) return "// Write your template code here\n";

    if (name.startsWith("test")) return "// Write your test cases here\n";
    if (name === "protocol.go")
      return `package main

// Define any shared protocols or interfaces here
`;
  }

  return "";
};

type ActionResult =
  | { success: true; message?: string; status?: number; id?: number }
  | { success: false; error?: string; status?: number };

type ProblemEditorState = {
  filesContent: Record<string, string>;
  activeFile: number;
  title: string;
  description: string;
  difficulty: string;
  isSubmitting: boolean;
};

export const useProblemEditor = (
  files: readonly ProblemFile[],
  initial?: {
    filesContent?: Record<string, string>;
    title?: string;
    description?: string;
    difficulty?: string;
    problemId?: number;
  }
) => {
  const router = useRouter();
  const [state, setState] = useState<ProblemEditorState>(() => {
    const filesContent = files.reduce(
      (acc, file) => {
        acc[file.name] =
          initial?.filesContent?.[file.name] ?? getInitialContent(file);
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      filesContent,
      activeFile: 0,
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      difficulty: initial?.difficulty ?? "1",
      isSubmitting: false,
    };
  });

  const syncFilesContent = useCallback(() => {
    setState((prev) => {
      const newFilesContent = files.reduce(
        (acc, file) => {
          acc[file.name] =
            prev.filesContent[file.name] ?? getInitialContent(file);
          return acc;
        },
        {} as Record<string, string>
      );
      return { ...prev, filesContent: newFilesContent };
    });
  }, [files]);

  const handleEditorContentChange = useCallback(
    (value: SetStateAction<string>) => {
      setState((prev) => {
        const activeFileName = files[prev.activeFile]?.name;
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
    [files]
  );

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setDifficulty = useCallback((difficulty: string) => {
    setState((prev) => ({ ...prev, difficulty }));
  }, []);

  const setActiveFile = useCallback((activeFile: number) => {
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

        const normalize = (n: string) => (n.startsWith("/") ? n.slice(1) : n);

        // Find the problem markdown key regardless of leading '/'
        const problemKey = Object.keys(state.filesContent).find((k) => {
          const nn = normalize(k);
          return nn === "problem.md" || nn.startsWith("problem");
        });

        if (!problemKey || !state.filesContent[problemKey]?.trim())
          missingFields.push("Problem markdown");

        const problemMarkdown = problemKey
          ? state.filesContent[problemKey]
          : "";

        const templateFiles = files.filter((f) =>
          normalize(f.name).startsWith("student")
        );
        const solutionFiles = files.filter((f) =>
          normalize(f.name).startsWith("solution")
        );
        const templateCode = templateFiles.map(
          (f) => state.filesContent[f.name] || ""
        );
        const solutionCode =
          solutionFiles.length > 0
            ? state.filesContent[solutionFiles[0].name] || ""
            : "";

        const testFiles = files.filter((f) =>
          normalize(f.name).startsWith("test")
        );
        const testCode = testFiles.map((f) => state.filesContent[f.name] || "");

        const protocolCode =
          files
            .filter((f) => normalize(f.name) === "protocol.go")
            .map((f) => state.filesContent[f.name] || "")[0] || "";

        if (!templateFiles.length || templateCode.some((c) => !c.trim()))
          missingFields.push("Template code");
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
            testFiles: testCode,
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
          templateCode,
          solutionCode,
          testCode,
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
    [state, files, initial?.problemId, router]
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
    syncFilesContent,
  };
};
