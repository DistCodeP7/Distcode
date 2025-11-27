import { type SetStateAction, useCallback, useState } from "react";
import { saveProblem } from "@/app/authorized/[id]/problemActions";
import type { EnvironmentVariable, Filemap, nodeSpec } from "@/drizzle/schema";

type ProblemFile = {
  name: string;
  fileType: "markdown" | "go";
};

const getInitialContent = (file: ProblemFile): string => {
  if (file.fileType === "markdown")
    return "# Problem\n\nDescribe the problem here.";
  if (file.fileType === "go") {
    if (file.name.startsWith("/template"))
      return "// Write your template code here\n";
    if (file.name.startsWith("/solution"))
      return "// Write your solution code here\n";
    if (file.name.startsWith("/test")) return "// Write your test cases here\n";
  }
  return "";
};

type ActionResult =
  | { success: true; message?: string; status?: number }
  | { success: false; error?: string; status?: number };

type ProblemEditorState = {
  filesContent: Filemap;
  activeFile: string;
  title: string;
  description: string;
  difficulty: string;
  isSubmitting: boolean;
  envs: EnvironmentVariable[];
  buildCommand: string;
  entryCommand: string;
};

export const useProblemEditor = (
  files: ProblemFile[],
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
      activeFile: files[0]?.name ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      difficulty: initial?.difficulty ?? "1",
      isSubmitting: false,
      envs: initial?.envs ?? [],
      buildCommand: initial?.buildCommand ?? "",
      entryCommand: initial?.entryCommand ?? "",
    };
  });

  const syncFilesContent = () => {
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
  };

  const handleEditorContentChange = (value: SetStateAction<string>) => {
    setState((prev) => {
      const activeFileName = prev.activeFile;
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
  };

  const setTitle = (title: string) => {
    setState((prev) => ({ ...prev, title }));
  };

  const setDescription = (description: string) => {
    setState((prev) => ({ ...prev, description }));
  };

  const setDifficulty = (difficulty: string) => {
    setState((prev) => ({ ...prev, difficulty }));
  };

  const setActiveFile = (activeFile: string) => {
    setState((prev) => ({ ...prev, activeFile }));
  };

  const setFileContent = (fileName: string, content: string) => {
    setState((prev) => {
      const newFiles: Record<string, string> = {
        ...(prev.filesContent as Record<string, string>),
      };
      newFiles[fileName] = content;
      return { ...prev, filesContent: newFiles as Filemap };
    });
  };

  const removeFile = (fileName: string) => {
    setState((prev) => {
      const newFiles: Record<string, string> = {
        ...(prev.filesContent as Record<string, string>),
      };
      if (fileName in newFiles) {
        delete newFiles[fileName];
      }
      return { ...prev, filesContent: newFiles as Filemap };
    });
  };

  const setBuildCommand = (buildCommand: string) => {
    setState((prev) => ({ ...prev, buildCommand }));
  };

  const setEntryCommand = (entryCommand: string) => {
    setState((prev) => ({ ...prev, entryCommand }));
  };

  const setEnvs = (envs: EnvironmentVariable[]) => {
    setState((prev) => ({ ...prev, envs }));
  };

  const handleSaveOrSubmit = async (isPublished: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const missingFields: string[] = [];
      if (!state.title.trim()) missingFields.push("Title");
      if (!state.description.trim()) missingFields.push("Description");
      if (!["1", "2", "3"].includes(state.difficulty))
        missingFields.push("Difficulty");

      const getContent = (name: string) =>
        (state.filesContent as Record<string, string>)[name] ?? "";
      if (!getContent("/problem.md").trim())
        missingFields.push("Problem markdown");

      const templateFiles = files.filter((f) => f.name.startsWith("/template"));
      const solutionFiles = files.filter((f) => f.name.startsWith("/solution"));
      const protocolFiles = files.filter((f) =>
        f.name.startsWith("/protocol.go")
      );

      const testFiles = files.filter((f) => f.name.startsWith("/tests"));

      const templateCode = templateFiles.map((f) => getContent(f.name));
      const solutionCode = solutionFiles.map((f) => getContent(f.name));
      const protocolCode = protocolFiles.map((f) => getContent(f.name));

      if (!templateFiles.length || templateCode.some((c) => !c.trim()))
        missingFields.push("Template code");
      if (!solutionFiles.length || solutionCode.some((c) => !c.trim()))
        missingFields.push("Solution code");
      if (!protocolFiles.length || protocolCode.some((c) => !c.trim()))
        missingFields.push("Protocol code");
      if (
        !testFiles.length ||
        testFiles.some((f) => !getContent(f.name).trim())
      )
        if (missingFields.length > 0) {
          alert(`Missing or empty fields: ${missingFields.join(", ")}`);
          return;
        }

      const filesMap = state.filesContent as Record<string, string>;
      const codeFolder: nodeSpec = {
        Files: { ...filesMap } as Filemap,
        Envs: state.envs,
        BuildCommand: state.buildCommand,
        EntryCommand: state.entryCommand,
      };

      const payload = {
        id: initial?.problemId,
        title: state.title,
        description: state.description,
        difficulty: parseInt(state.difficulty, 10),
        problemMarkdown:
          (state.filesContent as Record<string, string>)["/problem.md"] ?? "",
        isPublished,
        codeFolder,
      };

      const result: ActionResult = await saveProblem(payload);
      alert(
        result.success ? result.message || "Success!" : result.error || "Error."
      );
    } catch (err) {
      alert(`An unexpected error occurred: ${err}`);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    ...state,
    setTitle,
    setDescription,
    setDifficulty,
    setActiveFile,
    setFileContent,
    removeFile,
    setBuildCommand,
    setEntryCommand,
    setEnvs,
    handleEditorContentChange,
    handleSubmit: () => handleSaveOrSubmit(true),
    handleSave: () => handleSaveOrSubmit(false),
    syncFilesContent,
  };
};
