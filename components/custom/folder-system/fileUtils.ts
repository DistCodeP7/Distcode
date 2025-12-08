export function normalizePath(p: string) {
  return p.startsWith("/") ? p.slice(1) : p;
}

export function isProtectedName(normalizedName: string) {
  if (!normalizedName) return false;
  const n = normalizedName;

  return (
    n === "problem.md" ||
    n === "solution.md" ||
    n === "protocol.go" ||
    n === "main.go" ||
    n === "main_test.go"
  );
}

export type Section = "root" | "student" | "test" | "shared";

export type FileEntry = {
  key: string;
  name: string;
};

export function getFilesForSection(
  section: Section,
  files: Record<string, string>
): FileEntry[] {
  const all = Object.keys(files).map((k) => ({
    key: k,
    normalized: normalizePath(k),
  }));

  if (section === "root") {
    return all
      .filter(
        ({ normalized }) =>
          !normalized.startsWith("student/") &&
          !normalized.startsWith("test/") &&
          !normalized.startsWith("shared/") &&
          normalized !== "protocol.go"
      )
      .map(({ key, normalized }) => ({ key, name: normalized }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  if (section === "shared") {
    return all
      .filter(({ normalized }) => {
        if (normalized.startsWith("shared/")) return true;
        if (normalized === "protocol.go") return true;
        return false;
      })
      .map(({ key, normalized }) => ({
        key,
        name: normalized.replace(/^shared\//, ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // student / test
  return all
    .filter(({ normalized }) => normalized.startsWith(`${section}/`))
    .map(({ key, normalized }) => ({
      key,
      name: normalized.replace(`${section}/`, ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
