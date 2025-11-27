"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Editor, { CreateExerciseHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Filemap } from "@/drizzle/schema";
import { useProblemEditor } from "@/hooks/useProblemEditor";
import type { FileNode, FolderNode } from "@/lib/folderStructure";
import { flattenTree, TreeNode } from "./folder-structure";

/* ---------------- TREE BUILDER ---------------- */

export function buildTreeFromPaths(
  paths: string[],
  contents: Record<string, string>
): Array<FileNode | FolderNode> {
  const rootChildren: Array<FileNode | FolderNode> = [];

  for (const fullPath of paths) {
    const parts = fullPath.split("/").filter(Boolean);
    let current = rootChildren;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = part.includes(".") && i === parts.length - 1;

      if (isFile) {
        current.push({
          type: "file",
          name: part,
          path: fullPath,
          content: contents[fullPath] ?? "",
        });
      } else {
        let folder = current.find(
          (c) => c.type === "folder" && c.name === part
        ) as FolderNode;
        if (!folder) {
          folder = { type: "folder", name: part, children: [], isOpen: true };
          current.push(folder);
        }
        current = folder.children;
      }
    }
  }
  return rootChildren;
}

/* ---------------- MAIN COMPONENT ---------------- */

export default function ProblemEditorClient({
  files,
  initialFilesContent,
  initialTitle,
  initialDescription,
  initialDifficulty,
  problemId,
}: {
  files: Filemap;
  initialFilesContent?: Filemap;
  initialTitle?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  problemId?: number;
}) {
  const [activeFilePath, setActiveFilePath] = useState<string>("/problem.md");
  const [createdFiles, setCreatedFiles] = useState<Set<string>>(new Set());
  const [lastMarkdownPath, setLastMarkdownPath] =
    useState<string>("/problem.md"); // Track last .md for preview

  const filesForHook: { name: string; fileType: "go" | "markdown" }[] =
    Object.keys(files).map((path) => ({
      name: path,
      fileType: (path.endsWith(".go") ? "go" : "markdown") as "go" | "markdown",
    }));

  const {
    title,
    description,
    difficulty,
    setTitle,
    setDescription,
    setDifficulty,
    handleEditorContentChange,
    handleSubmit,
    filesContent,
  } = useProblemEditor(filesForHook, {
    filesContent: initialFilesContent,
    title: initialTitle,
    description: initialDescription,
    difficulty: initialDifficulty,
    problemId,
  });

  const allFilePaths = useMemo(
    () => [...Object.keys(files), ...Array.from(createdFiles)],
    [files, createdFiles]
  );

  const treeNodes = useMemo(
    () =>
      buildTreeFromPaths(allFilePaths, filesContent as Record<string, string>),
    [allFilePaths, filesContent]
  );

  const handleAddFile = (folderAndName: string) => {
    const fullPath = folderAndName.startsWith("/")
      ? folderAndName
      : `/${folderAndName}`;
    if ((filesContent as Record<string, string>)[fullPath]) {
      toast.error("File already exists");
      return;
    }
    setCreatedFiles((prev) => new Set([...prev, fullPath]));
    (filesContent as Record<string, string>)[fullPath] = "// New file";
    setActiveFilePath(fullPath);
    toast.success(`Created ${fullPath}`);
  };

  const handleDeleteFile = (filePath: string) => {
    if (!createdFiles.has(filePath)) {
      toast.error("Can only delete newly created files");
      return;
    }
    // Prevent deletion of any .md file
    if (filePath.endsWith(".md")) {
      toast.error("Markdown files cannot be deleted");
      return;
    }

    setCreatedFiles((prev) => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });

    // @ts-expect-error
    setActiveFilePath((prev) => (prev === filePath ? null : prev));
    delete (filesContent as Record<string, string>)[filePath];
    toast.success(`Deleted ${filePath}`);
  };

  // Custom click handler to track last markdown file
  const handleFileClick = (file: FileNode) => {
    setActiveFilePath(file.path);
    if (file.name.endsWith(".md")) {
      setLastMarkdownPath(file.path);
    }
  };

  const activeFile = activeFilePath
    ? (treeNodes.flatMap(flattenTree).find((f) => f.path === activeFilePath) ??
      null)
    : null;

  const previewContent =
    (filesContent as Record<string, string>)[lastMarkdownPath] ?? "";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-background flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Problem title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-3xl font-bold bg-transparent outline-none border-none"
          />
          <div className="w-48 min-w-[10rem]">
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full text-base font-medium">
                <SelectValue placeholder="Select difficulty">
                  {difficulty === "1" && (
                    <span className="text-chart-2 font-semibold">Easy</span>
                  )}
                  {difficulty === "2" && (
                    <span className="text-chart-3 font-semibold">Medium</span>
                  )}
                  {difficulty === "3" && (
                    <span className="text-primary font-semibold">Hard</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Easy</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input
          placeholder="Short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Editor + Preview */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border h-full w-full min-w-0"
      >
        {/* LEFT SIDE */}
        <ResizablePanel minSize={25}>
          <div className="flex h-full overflow-hidden">
            <div className="w-64 border-r p-2 overflow-auto">
              {treeNodes.map((node) => (
                <TreeNode
                  key={node.type === "file" ? node.path : node.name}
                  node={node}
                  onFileClick={handleFileClick}
                  activeFilePath={activeFilePath}
                  onAddFile={handleAddFile}
                  onDeleteFile={handleDeleteFile}
                  createdFiles={createdFiles}
                />
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              {activeFile && (
                <Editor
                  file={activeFile}
                  setEditorContent={(text) => handleEditorContentChange(text)}
                />
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT SIDE */}
        <ResizablePanel minSize={20} className="overflow-auto">
          <CreateExerciseHeader
            onSubmitAction={handleSubmit}
            disabled={false}
          />
          <MarkdownPreview content={previewContent} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
