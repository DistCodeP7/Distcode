"use client";

import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import FileAlertDialog from "@/components/custom/fileAlertDialog";
import {
  type FileEntry,
  getFilesForSection,
  isProtectedName,
  type Section,
} from "@/components/custom/folder-system/fileUtils";
import { FileTypeIcon } from "@/components/custom/icon";
import { Button } from "@/components/ui/button";

type FileSectionProps = {
  title: string;
  section: Section;
  files: Record<string, string>;
  activeFilePath?: string;
  onFileChange: (path: string) => void;
  onCreateFile?: (filename: string, parentPath: string) => void;
  onDeleteFile?: (path: string) => void;
};

export function FileSection({
  title,
  section,
  files,
  activeFilePath,
  onFileChange,
  onCreateFile,
  onDeleteFile,
}: FileSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deletePath, setDeletePath] = useState<string | null>(null);

  const sectionFiles: FileEntry[] = getFilesForSection(section, files);

  const canCreate = Boolean(onCreateFile) && section !== "root";

  const handleCreate = (filename: string) => {
    const parts = filename.split("/");
    const base = parts.pop() || filename;

    // Protected names
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

    let finalBase = base;

    // If creating inside the test folder, ensure filename ends with _test.go
    if (section === "test") {
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

    onCreateFile?.(finalFilename, section);
    setCreateOpen(false);
  };

  return (
    <div className="w-full">
      <div className="flex items-center h-8 font-semibold text-sm w-full px-2">
        <span className="flex items-center flex-1">
          {section === "root" ? "Files" : <>📂 {title}/</>}
        </span>

        {canCreate && (
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
              onCreate={handleCreate}
              currentPath={`${section}/`}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {sectionFiles.length === 0 ? (
          <div className="px-2 text-sm text-muted-foreground py-1">
            No files.
          </div>
        ) : (
          sectionFiles.map((f) => (
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
