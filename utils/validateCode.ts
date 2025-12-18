import type { Filemap } from "@/types/actionTypes";

export async function checkUserCode(submissionCode: Filemap) {
  const errors: string[] = [];
  if (Object.keys(submissionCode).length === 0) {
    errors.push("No submission code provided.");
    return errors;
  }
  Object.values(submissionCode).forEach((code: string, _) => {
    if (code.trim() === "") {
      errors.push("Submission code cannot be empty.");
    }
    if (!code.includes("package")) {
      errors.push("Submission code must declare a package.");
    }
    if (!code.includes("func")) {
      errors.push("Submission code must declare at least one function.");
    }

    const importRegex = /import\s+\(([\s\S]*?)\)/;
    const match = importRegex.exec(code);
    if (!match) {
      return;
    }

    const importBlock = match[0];
    const importContent = match[1];
    const codeBody = code.replace(importBlock, "");
    const importLines = importContent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    importLines.forEach((line) => {
      // Ignore comment lines in import block
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("//")) return;
      const importSpecMatch = trimmedLine.match(/([a-zA-Z0-9_.]*)\s*"([^"]+)"/);
      if (!importSpecMatch) return;
      const alias = importSpecMatch[1];
      const path = importSpecMatch[2];
      if (alias === "_") {
        return;
      }
      const identifier = alias || path.split("/").pop();

      if (identifier) {
        const usageRegex = new RegExp(`\\b${identifier}\\.`);
        if (!usageRegex.test(codeBody)) {
          errors.push(`Unused import:${path}`);
        }
      }
    });
  });
  if (errors.length > 0) {
    return errors;
  }
  return null;
}
