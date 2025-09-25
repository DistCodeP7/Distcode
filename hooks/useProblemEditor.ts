import { type SetStateAction, useCallback, useState } from "react";
import { submitProblem } from "@/app/authorized/editor/problem/submitProblem";

type ProblemFile = {
  name: string;
  fileType: "markdown" | "go";
};

const getInitialContent = (file: ProblemFile): string =>
  file.fileType === "markdown"
    ? `# ${file.name.replace(".md", "")}\n\nStart writing your problem...`
    : `// Start coding your ${file.name.replace(".go", "")} in Go...`;

type ProblemEditorState = {
  filesContent: string[];
  activeFile: number;
  title: string;
  description: string;
  difficulty: string;
  isSubmitting: boolean;
};

export const useProblemEditor = (files: readonly ProblemFile[]) => {
  const [state, setState] = useState<ProblemEditorState>({
    filesContent: files.map(getInitialContent),
    activeFile: 0,
    title: "",
    description: "",
    difficulty: "",
    isSubmitting: false,
  });

  const handleEditorContentChange = useCallback(
    (value: SetStateAction<string>) => {
      setState((prev) => {
        const newContent =
          typeof value === "function"
            ? value(prev.filesContent[prev.activeFile])
            : value;

        const updatedFiles = [...prev.filesContent];
        updatedFiles[prev.activeFile] = newContent;

        return { ...prev, filesContent: updatedFiles };
      });
    },
    []
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

  const handleSubmit = useCallback(async () => {
    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      if (!state.difficulty || !["1", "2", "3"].includes(state.difficulty)) {
        alert("Please select a difficulty before submitting.");
        return;
      }

      const difficultyInt = parseInt(state.difficulty, 10);

      const result = await submitProblem({
        title: state.title,
        description: state.description,
        difficulty: difficultyInt,
        rating: 0,
        problemMarkdown: state.filesContent[0],
        templateCode: state.filesContent[1],
        solutionCode: state.filesContent[2],
        testCasesCode: state.filesContent[3],
      });

      if (result.success) {
        alert(result.message || "Problem submitted successfully!");
      } else {
        alert(result.error || "Failed to submit problem.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected server error occurred.");
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [state.title, state.description, state.difficulty, state.filesContent]);

  return {
    ...state,
    setTitle,
    setDescription,
    setDifficulty,
    setActiveFile,
    handleEditorContentChange,
    handleSubmit,
  };
};
