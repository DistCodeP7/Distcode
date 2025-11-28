import { type SetStateAction, useState } from "react";
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
    if (file.name.startsWith("student") || file.name.startsWith("/student"))
      return "// Write your student code here\n";
    if (file.name.startsWith("solution"))
      return "// Write your solution code here\n";
    if (file.name.startsWith("test") || file.name.startsWith("/test"))
      return "// Write your test cases here\n";
  }
  return "";
};

type ActionResult =
  | { success: true; message?: string; status?: number }
  | { success: false; error?: string; status?: number };

type ProblemEditorState = {
  filesContent: Record<string, string>;
  activeFile: string;
  title: string;
  description: string;
  difficulty: string;
  isSubmitting: boolean;
};

export const useProblemEditor = (
  files: ProblemFile[],
  initial?: {
    filesContent?: nodeSpec[];
    title?: string;
    description?: string;
    difficulty?: string;
    problemId?: number;
  }
) => {
  // Normalize file names to a canonical form (no leading slash)
  const normalize = (p: string) => (p.startsWith("/") ? p.slice(1) : p);

  const normalizedFiles = files.map((f) => ({
    ...f,
    name: normalize(f.name),
  }));

  const [state, setState] = useState<ProblemEditorState>(() => {
    const filesMap: Record<string, string> = {};
    if (initial?.filesContent && Array.isArray(initial.filesContent)) {
      for (const node of initial.filesContent) {
        for (const rawName of Object.keys(node.Files)) {
          const fileName = normalize(rawName);
          const fileType = fileName.endsWith(".md") ? "markdown" : "go";
          const file: ProblemFile = { name: fileName, fileType };
          const content: string | undefined = node.Files[rawName];
          filesMap[fileName] = content ?? getInitialContent(file);
        }
      }
    } else if (
      initial?.filesContent &&
      typeof initial.filesContent === "object" &&
      !Array.isArray(initial.filesContent)
    ) {
      for (const rawName of Object.keys(
        initial.filesContent as Record<string, string>
      )) {
        const fileName = normalize(rawName);
        const fileType = fileName.endsWith(".md") ? "markdown" : "go";
        const file: ProblemFile = { name: fileName, fileType };
        const content: string | undefined = (
          initial.filesContent as Record<string, string>
        )[rawName];
        filesMap[fileName] = content ?? getInitialContent(file);
      }
    } else {
      for (const file of normalizedFiles) {
        filesMap[file.name] = getInitialContent(file);
      }
    }
    return {
      filesContent: filesMap,
      activeFile: normalizedFiles[0]?.name ?? "",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      difficulty: initial?.difficulty ?? "1",
      isSubmitting: false,
    };
  });

  const syncFilesContent = () => {
    setState((prev) => {
      const newFiles: Record<string, string> = {
        ...(prev.filesContent as Record<string, string>),
      };

      for (const file of normalizedFiles) {
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
    // normalize active file
    const normalize = (p: string) => (p.startsWith("/") ? p.slice(1) : p);
    setState((prev) => ({ ...prev, activeFile: normalize(activeFile) }));
  };

  const setFileContent = (fileName: string, content: string) => {
    setState((prev) => {
      const newFiles: Record<string, string> = {
        ...(prev.filesContent as Record<string, string>),
      };
      const normalized = fileName.startsWith("/")
        ? fileName.slice(1)
        : fileName;
      newFiles[normalized] = content;
      return { ...prev, filesContent: newFiles as Filemap };
    });
  };

  const removeFile = (fileName: string) => {
    setState((prev) => {
      const newFiles: Record<string, string> = {
        ...(prev.filesContent as Record<string, string>),
      };
      const normalized = fileName.startsWith("/")
        ? fileName.slice(1)
        : fileName;
      if (normalized in newFiles) {
        delete newFiles[normalized];
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
        (state.filesContent as Record<string, string>)[
          name.startsWith("/") ? name.slice(1) : name
        ] ?? "";
      if (!getContent("problem.md").trim())
        missingFields.push("Problem markdown");

      const paramNames = normalizedFiles.map((f) => f.name);
      console.log("Param names for validation:", paramNames);

      const templateFiles = paramNames.filter(
        (n) => n.startsWith("student") || n.startsWith("/student")
      );
      const solutionFiles = paramNames.filter((n) => n.startsWith("solution"));
      const protocolFiles = paramNames.filter(
        (n) => n === "protocol.go" || n.startsWith("protocol.go")
      );
      const testFiles = paramNames.filter(
        (n) => n.startsWith("test") || n.startsWith("/test")
      );

      const templateCode = templateFiles.map((name) => getContent(name));
      const solutionCode = solutionFiles.map((name) => getContent(name));
      const protocolCode = protocolFiles.map((name) => getContent(name));

      if (!templateFiles.length || templateCode.some((c) => !c.trim()))
        missingFields.push("Student code");
      if (!solutionFiles.length || solutionCode.some((c) => !c.trim()))
        missingFields.push("Solution code");
      if (!protocolFiles.length || protocolCode.some((c) => !c.trim()))
        missingFields.push("Protocol code");
      if (
        !testFiles.length ||
        testFiles.some((name) => !getContent(name).trim())
      )
        missingFields.push("Tests");

      if (missingFields.length > 0) {
        alert(`Missing or empty fields: ${missingFields.join(", ")}`);
        return;
      }

      const filesMap = state.filesContent as Record<string, string>;

      // Helper to group files by folder
      const folderMap: Record<string, Record<string, string>> = {};
      for (const fileName of Object.keys(filesMap)) {
        // Extract folder name (e.g. "Student", "Root", etc.) from normalized name
        const match = fileName.match(/^([^/]+)\//);
        const folder = match ? match[1] : "Root";
        if (!folderMap[folder]) folderMap[folder] = {};
        const keyName = folder === "Root" ? fileName : `/${fileName}`;
        folderMap[folder][keyName] = filesMap[fileName];
      }

      const codeFolder: nodeSpec[] = Object.entries(folderMap).map(
        ([alias, files]) => ({
          Alias: alias,
          Files: files as Filemap,
          Envs: [],
          BuildCommand: "",
          EntryCommand: "",
        })
      );

      const payload = {
        id: initial?.problemId,
        title: state.title,
        description: state.description,
        difficulty: parseInt(state.difficulty, 10),
        problemMarkdown: getContent("problem.md"),
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
