import { type SetStateAction, useCallback, useState, useEffect } from "react";
import { saveProblem } from "@/app/authorized/[id]/problemActions";

type ProblemFile = {
  name: string;
  fileType: "markdown" | "go";
};

const getInitialContent = (file: ProblemFile): string => {
  if (file.fileType === "markdown") {
    return "# Problem\n\nDescribe the problem here.";
  }
  if (file.fileType === "go") {
    if (file.name.startsWith("template")) {
      return "// Write your template code here\n";
    }
    if (file.name.startsWith("solution")) {
      return "// Write your solution code here\n";
    }
    if (file.name === "testCases.go") {
      return "// Write your test cases here\n";
    }
  }
  return "";
};

type ActionResult =
  | { success: true; message?: string; status?: number }
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
  const [state, setState] = useState<ProblemEditorState>({
    filesContent: files.reduce(
      (acc, file) => {
        acc[file.name] =
          initial?.filesContent?.[file.name] ?? getInitialContent(file);
        return acc;
      },
      {} as Record<string, string>
    ),
    activeFile: 0,
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    difficulty: initial?.difficulty ?? "1",
    isSubmitting: false,
  });

  useEffect(() => {
    setState((prev) => {
      const newFilesContent = files.reduce(
        (acc, file) => {
          // Keep existing content for files that still exist, otherwise add initial content
          acc[file.name] =
            prev.filesContent[file.name] || getInitialContent(file);
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
        if (!state.difficulty || !["1", "2", "3"].includes(state.difficulty))
          missingFields.push("Difficulty");
        if (!state.filesContent["problem.md"].trim())
          missingFields.push("Problem markdown");

        const templateFiles = files.filter((f) =>
          f.name.startsWith("template")
        );
        const solutionFiles = files.filter((f) =>
          f.name.startsWith("solution")
        );
        const templateCode = templateFiles.map(
          (f) => state.filesContent[f.name] || ""
        );
        const solutionCode = solutionFiles.map(
          (f) => state.filesContent[f.name] || ""
        );

        if (
          templateFiles.length === 0 ||
          templateCode.some((code) => !code.trim())
        )
          missingFields.push("Template code");
        if (
          solutionFiles.length === 0 ||
          solutionCode.some((code) => !code.trim())
        )
          missingFields.push("Solution code");
        if (!state.filesContent["testCases.go"].trim())
          missingFields.push("Test cases code");

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
          testCasesCode: state.filesContent["testCases.go"],
          isPublished,
        };

        const result: ActionResult = await saveProblem(payload);

        if (result.success) {
          alert(result.message || "Success!");
        } else {
          alert(result.error || "An error occurred.");
        }
      } catch (err) {
        alert(`An unexpected server error occurred.${err}`);
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [
      state.title,
      state.description,
      state.difficulty,
      state.filesContent,
      files,
      initial?.problemId,
    ]
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
  };
};
