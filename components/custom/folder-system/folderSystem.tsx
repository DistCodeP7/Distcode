"use client";

import { FileSection } from "@/components/custom/folder-system/fileSection";
import type { Section } from "@/components/custom/folder-system/fileUtils";
import type { Paths } from "@/drizzle/schema";

interface FolderSystemProps {
  files: Paths;
  onFileChange: (path: string) => void;
  onCreateFile?: (filename: string, parentPath: string) => void;
  onDeleteFile?: (path: string) => void;
  activeFilePath?: string;
  sections?: Array<Section>;
}

export function FolderSystem({
  files,
  onFileChange,
  onCreateFile,
  onDeleteFile,
  activeFilePath,
  sections,
}: FolderSystemProps) {
  const shouldShow = (name: Section) => !sections || sections.includes(name);

  return (
    <div className="flex flex-col h-full w-full max-w-[50vw]">
      <div className="flex-1 overflow-y-auto py-2">
        {shouldShow("root") && (
          <FileSection
            title="Files"
            section="root"
            files={files}
            activeFilePath={activeFilePath}
            onFileChange={onFileChange}
            onDeleteFile={onDeleteFile}
          />
        )}

        {shouldShow("student") && (
          <FileSection
            title="student"
            section="student"
            files={files}
            activeFilePath={activeFilePath}
            onFileChange={onFileChange}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
          />
        )}

        {shouldShow("test") && (
          <FileSection
            title="test"
            section="test"
            files={files}
            activeFilePath={activeFilePath}
            onFileChange={onFileChange}
            onCreateFile={onCreateFile}
            onDeleteFile={onDeleteFile}
          />
        )}

        {shouldShow("shared") && (
          <FileSection
            title="shared"
            section="shared"
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
