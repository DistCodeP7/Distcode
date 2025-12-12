import { defaultMain } from "@/default_files/defaultMain";
import { defaultTest } from "@/default_files/defaultTest";
import type { Filemap } from "@/types/actionTypes";

export const getDefaultFileContent = (filePath: string): string => {
  if (filePath.startsWith("student")) return defaultMain;
  if (filePath.startsWith("test")) return defaultTest;
  if (filePath.startsWith("shared")) return "package shared";
  if (filePath.endsWith(".md")) return "";
  return `// New file: ${filePath.split("/").pop()}`;
};

export const normalizeFilePath = (filePath: string): string => {
  if (!filePath.includes(".")) {
    return `${filePath}.go`;
  }
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
};

export const isProtectedFile = (filePath: string): boolean =>
  [
    "problem.md",
    "solution.md",
    "student/main.go",
    "test/main_test.go",
    "shared/protocol.go",
  ].some((p) => filePath.includes(p));

type BuildResult =
  | {
      success: true;
      payload: {
        id?: number;
        problemMarkdown: string;
        solutionMarkdown: string;
        studentCode: Filemap;
        testCode: Filemap;
        protocolCode: Filemap;
        isPublished?: boolean;
      };
    }
  | { success: false; missing: string[] };

export const buildExercisePayload = (
  filesContent: Filemap,
  id?: number,
  isPublished?: boolean
): BuildResult => {
  const missing: string[] = [];

  const problemMarkdown = filesContent["problem.md"];
  if (!problemMarkdown?.trim()) missing.push("problem.md is empty");

  const solutionMarkdown = filesContent["solution.md"];
  if (!solutionMarkdown?.trim()) missing.push("solution.md is empty");

  const groups: Record<string, Filemap> = {
    student: {},
    test: {},
    shared: {},
  };

  Object.entries(filesContent).forEach(([file, content]) => {
    if (file.startsWith("student")) groups.student[file] = content;
    else if (file.startsWith("test")) groups.test[file] = content;
    else if (file.startsWith("shared")) groups.shared[file] = content;
  });

  const checkGroupFiles = (label: string, group: Filemap) => {
    const files = Object.keys(group);
    if (!files.length) {
      missing.push(`${label} files missing`);
      return;
    }

    const emptyFiles = files.filter((file) => !group[file]?.trim());
    if (emptyFiles.length) {
      missing.push(`${label} files empty: ${emptyFiles.join(", ")}`);
    }
  };

  Object.entries(groups).forEach(([label, group]) => {
    checkGroupFiles(label, group);
  });

  if (missing.length) return { success: false, missing };

  return {
    success: true,
    payload: {
      id,
      problemMarkdown,
      solutionMarkdown,
      studentCode: groups.student,
      testCode: groups.test,
      protocolCode: groups.shared,
      isPublished,
    },
  };
};
