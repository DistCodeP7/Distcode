import { type SetStateAction, useCallback, useState } from "react";
import { saveProblem } from "@/app/authorized/[id]/problemActions";
import type { EnvironmentVariable, Filemap, nodeSpec } from "@/drizzle/schema";

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
  | { success: true; message?: string; status?: number }
  | { success: false; error?: string; status?: number };

type ProblemEditorState = {
  filesContent: Filemap;
  activeFile: number;
  title: string;
  description: string;
  difficulty: string;
  isSubmitting: boolean;
  envs: EnvironmentVariable[];
  buildCommand: string;
  entryCommand: string;
};

export const useProblemEditor = (
  files: readonly ProblemFile[],
  initial?: {
    filesContent?: Filemap;
    title?: string;
    description?: string;
    difficulty?: string;
    problemId?: number;
    envs?: EnvironmentVariable[];
    buildCommand?: string;
    entryCommand?: string;
  }
) => {
  const [state, setState] = useState<ProblemEditorState>(() => {
    const filesMap: Filemap = {} as Record<string, string>;
    for (const file of files) {
      let content: string | undefined;
      const ic = initial?.filesContent as Filemap | undefined;
      if (ic && typeof ic === "object") {
        content = (ic as Record<string, string>)[file.name];
      }
      filesMap[file.name] = content ?? getInitialContent(file);
    }

    return {
      filesContent: filesMap,
      activeFile: 0,
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      difficulty: initial?.difficulty ?? "1",
      isSubmitting: false,
      envs: initial?.envs ?? [],
      buildCommand: initial?.buildCommand ?? "",
      entryCommand: initial?.entryCommand ?? "",
    };
  });

  const syncFilesContent = useCallback(() => {
    setState((prev) => {
      const newFiles: Record<string, string> = {
        ...(prev.filesContent as Record<string, string>),
      };
      for (const file of files) {
        if (!(file.name in newFiles)) {
          newFiles[file.name] = getInitialContent(file);
        }
      }
      return { ...prev, filesContent: newFiles as Filemap };
    });
  }, [files]);

  const handleEditorContentChange = useCallback(
    (value: SetStateAction<string>) => {
      setState((prev) => {
        const activeFileName = files[prev.activeFile]?.name;
        if (!activeFileName) return prev;
        const prevContent =
          (prev.filesContent as Record<string, string>)[activeFileName] ?? "";
        const newContent =
          typeof value === "function" ? value(prevContent) : value;
        const newFiles: Record<string, string> = {
          ...(prev.filesContent as Record<string, string>),
        };
        newFiles[activeFileName] = newContent;
        return { ...prev, filesContent: newFiles as Filemap };
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

  const setBuildCommand = useCallback((buildCommand: string) => {
    setState((prev) => ({ ...prev, buildCommand }));
  }, []);

  const setEntryCommand = useCallback((entryCommand: string) => {
    setState((prev) => ({ ...prev, entryCommand }));
  }, []);

  const setEnvs = useCallback((envs: EnvironmentVariable[]) => {
    setState((prev) => ({ ...prev, envs }));
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

        const payload = {
          id: initial?.problemId,
          title: state.title,
          description: state.description,
          difficulty: parseInt(state.difficulty, 10),
          problemMarkdown: state.filesContent["problem.md"],
          templateCode,
          solutionCode,
          testCode,
          protocolCode,
          isPublished,
          codeFolder,
        };

        const result: ActionResult = await saveProblem(payload);
        alert(
          result.success
            ? result.message || "Success!"
            : result.error || "Error."
        );
      } catch (err) {
        alert(`An unexpected error occurred: ${err}`);
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [state, files, initial?.problemId]
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
    setBuildCommand,
    setEntryCommand,
    setEnvs,
    handleEditorContentChange,
    handleSubmit,
    handleSave,
    syncFilesContent,
  };
};
