import { defaultMain } from "@/default_files/defaultMain";
import { defaultTest } from "@/default_files/defaultTest";
import type { Paths } from "@/drizzle/schema";

export const getDefaultFileContent = (filePath: string): string => {
  if (filePath.startsWith("student")) return defaultMain;
  if (filePath.startsWith("test")) return defaultTest;
  if (filePath.startsWith("shared")) return "package shared";
  if (filePath.endsWith(".md")) return "";
  return `// New file: ${filePath.split("/").pop()}`;
};

export const normalizeFilePath = (filePath: string): string => {
  const cleaned = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  if (!cleaned.includes(".")) {
    return `${cleaned}.go`;
  }
  return cleaned;
};

export const isProtectedFile = (filePath: string): boolean => {
  return [
    "student/main.go",
    "test/main_test.go",
    "problem.md",
    "protocol.go",
    "solution.md",
  ].some((protectedPath) => filePath.includes(protectedPath));
};

export const buildProblemPayload = (
  filesContent: Paths,
  id?: number,
  isPublished: boolean = false
) => {
  const missingFields: string[] = [];

  const problemKey = Object.keys(filesContent).find((k) => k === "problem.md");
  const problemMarkdown = problemKey ? filesContent[problemKey] : "";
  if (!problemMarkdown?.trim()) missingFields.push("Problem markdown");

  const studentFiles: Paths = {};
  const testFiles: Paths = {};
  const protocolFiles: Paths = {};
  let solutionCode = "";

  Object.entries(filesContent).forEach(([key, content]) => {
    const val = content || "";
    if (key.startsWith("student")) studentFiles[key] = val;
    else if (key.startsWith("test")) testFiles[key] = val;
    else if (key.startsWith("shared")) protocolFiles[key] = val;
    else if (key.startsWith("solution")) solutionCode = val;
  });

  // Validation Rules
  const hasStudentCode = Object.values(studentFiles).some((c) => c?.trim());
  const hasTestCode = Object.values(testFiles).some((c) => c?.trim());

  if (!Object.keys(studentFiles).length || !hasStudentCode)
    missingFields.push("Student code");
  if (!solutionCode.trim()) missingFields.push("Solution code");
  if (!Object.keys(testFiles).length || !hasTestCode)
    missingFields.push("Test code");

  if (missingFields.length > 0) {
    return { success: false, missingFields };
  }

  return {
    success: true,
    payload: {
      id,
      problemMarkdown,
      studentCode: studentFiles,
      solutionCode,
      testCode: testFiles,
      protocolCode: protocolFiles,
      isPublished,
    },
  };
};
