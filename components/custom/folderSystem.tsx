import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Paths } from "@/drizzle/schema";
import { Button } from "../ui/button";
import FileAlertDialog from "./fileAlertDialog";
import { FileTypeIcon } from "./Icon";

function normalizePath(p: string) {
  return p.startsWith("/") ? p.slice(1) : p;
}

function isProtectedName(normalizedName: string) {
  if (!normalizedName) return false;
  const n = normalizedName;
  if (
    n === "problem.md" ||
    n === "solution.md" ||
    n === "protocol.go" ||
    n === "main.go" ||
    n === "main_test.go"
  )
    return true;
  return false;
}

function FolderSection({
  title,
  folderKey,
  files,
  activeFilePath,
  onFileChange,
  onCreateFile,
  onDeleteFile,
}: {
  title: string;
  folderKey: string;
  files: Record<string, string>;
  activeFilePath?: string;
  onFileChange: (path: string) => void;
  onCreateFile?: (filename: string, parentPath: string) => void;
  onDeleteFile?: (path: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deletePath, setDeletePath] = useState<string | null>(null);

  const folderFiles = Object.keys(files)
    .map((k) => ({ key: k, normalized: normalizePath(k) }))
    .filter(({ normalized }) => {
      if (normalized.startsWith(`${folderKey}/`)) return true;
      if (folderKey === "shared") {
        if (normalized === "protocol.go") return true;
      }
      return false;
    })
    .map(({ key, normalized }) => ({
      key,
      name: normalized.replace(`${folderKey}/`, ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full">
      <div className="flex items-center h-8 font-semibold text-sm w-full px-2">
        <span className="flex items-center flex-1">📂 {title}/</span>
        {onCreateFile && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCreateOpen(true)}
              title={`Create file in ${title}`}
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
            <FileAlertDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              onCreate={(filename) => {
                // normalize creation: prevent protected basenames
                const parts = filename.split("/");
                const base = parts.pop() || filename;
                if (
                  [
                    "main",
                    "main.go",
                    "main_test",
                    "main_test.go",
                    "protocol",
                    "protocol.go",
                  ].includes(base)
                ) {
                  toast.error(`Cannot create a file named ${base}`);
                  setCreateOpen(false);
                  return;
                }

                // If creating inside the test folder, ensure filename ends with _test.go
                let finalBase = base;

                if (folderKey === "test") {
                  if (!finalBase.endsWith("_test.go")) {
                    if (finalBase.endsWith("_test")) {
                      finalBase += ".go";
                    } else {
                      finalBase = `${finalBase.replace(/\.go$/, "")}_test.go`;
                    }
                  }
                }

                parts.push(finalBase);
                const finalFilename = parts.join("/");

                onCreateFile(finalFilename, folderKey);
                setCreateOpen(false);
              }}
              currentPath={`${folderKey}/`}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {folderFiles.length === 0 ? (
          <div className="px-2 text-sm text-muted-foreground py-1">
            No files.
          </div>
        ) : (
          folderFiles.map((f) => (
            <div key={f.key} className="relative w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFileChange(f.key)}
                className={`w-full min-w-0 shrink justify-start text-left gap-2 text-sm h-8 rounded-none ${
                  f.key === activeFilePath
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
                style={{ paddingLeft: "8px", paddingRight: "2.5rem" }}
              >
                <FileTypeIcon
                  name={f.name.endsWith(".go") ? "go" : "markdown"}
                />
                <span className="truncate min-w-0 flex-1">{f.name}</span>
              </Button>

              {onDeleteFile && !isProtectedName(f.name) && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletePath(f.key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-destructive"
                    title={`Delete ${f.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>

                  <FileAlertDialog
                    open={deletePath === f.key}
                    onOpenChange={(open) => !open && setDeletePath(null)}
                    onDelete={() => {
                      if (f.key) onDeleteFile(f.key);
                      setDeletePath(null);
                    }}
                    defaultName={f.name}
                  />
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RootSection({
  files,
  activeFilePath,
  onFileChange,
  onDeleteFile,
}: {
  files: Record<string, string>;
  activeFilePath?: string;
  onFileChange: (path: string) => void;
  onDeleteFile?: (path: string) => void;
}) {
  const [deletePath, setDeletePath] = useState<string | null>(null);

  const rootFiles = Object.keys(files)
    .map((k) => ({ key: k, normalized: normalizePath(k) }))
    .filter(
      ({ normalized }) =>
        !normalized.startsWith("student/") &&
        !normalized.startsWith("test/") &&
        !normalized.startsWith("shared/") &&
        normalized !== "protocol.go"
    )
    .map(({ key, normalized }) => ({ key, name: normalized }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full">
      <div className="flex items-center h-8 font-semibold text-sm w-full px-2">
        <span className="flex items-center flex-1">Files</span>
      </div>

      <div className="flex flex-col">
        {rootFiles.length === 0 ? (
          <div className="px-2 text-sm text-muted-foreground py-1">
            No files.
          </div>
        ) : (
          rootFiles.map((f) => (
            <div key={f.key} className="relative w-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFileChange(f.key)}
                className={`w-full min-w-0 shrink justify-start text-left gap-2 text-sm h-8 rounded-none ${
                  f.key === activeFilePath
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
                style={{ paddingLeft: "8px", paddingRight: "2.5rem" }}
              >
                <FileTypeIcon
                  name={f.name.endsWith(".go") ? "go" : "markdown"}
                />
                <span className="truncate min-w-0 flex-1">{f.name}</span>
              </Button>

              {onDeleteFile && !isProtectedName(f.name) && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletePath(f.key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-destructive"
                    title={`Delete ${f.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>

                  <FileAlertDialog
                    open={deletePath === f.key}
                    onOpenChange={(open) => !open && setDeletePath(null)}
                    onDelete={() => {
                      if (f.key) onDeleteFile(f.key);
                      setDeletePath(null);
                    }}
                    defaultName={f.name}
                  />
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface FolderSystemProps {
  files: Paths;
  onFileChange: (path: string) => void;
  onCreateFile?: (filename: string, parentPath: string) => void;
  onDeleteFile?: (path: string) => void;
  activeFilePath?: string;
  sections?: Array<"root" | "student" | "test" | "shared">;
}

export function FolderSystem({
  files,
  onFileChange,
  onCreateFile,
  onDeleteFile,
  activeFilePath,
  sections,
}: FolderSystemProps) {
  const shouldShow = (name: "root" | "student" | "test" | "shared") =>
    !sections || sections.includes(name);

  return (
    <div className="flex flex-col h-full w-full max-w-[50vw]">
      <div className="flex-1 overflow-y-auto py-2">
        {shouldShow("root") && (
          <RootSection
            files={files}
            activeFilePath={activeFilePath}
            onFileChange={onFileChange}
            onDeleteFile={onDeleteFile}
          />
        )}

        {shouldShow("student") && (
          <FolderSection
            title="student"
            folderKey="student"
            files={files}
            activeFilePath={activeFilePath}
            onFileChange={onFileChange}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
          />
        )}

        {shouldShow("test") && (
          <FolderSection
            title="test"
            folderKey="test"
            files={files}
            activeFilePath={activeFilePath}
            onFileChange={onFileChange}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
          />
        )}

        {shouldShow("shared") && (
          <FolderSection
            title="shared"
            folderKey="shared"
            files={files}
            activeFilePath={activeFilePath}
            onFileChange={onFileChange}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
          />
        )}
      </div>
    </div>
  );
}
