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
import type { nodeSpec } from "@/drizzle/schema";
import { useProblemEditor } from "@/hooks/useProblemEditor";
import type { FileNode } from "@/lib/folderStructure";
import { buildTreeFromPaths, flattenTree, TreeNode } from "./folder-structure";

export default function ProblemEditorClient({
  files,
  initialFilesContent,
  initialTitle,
  initialDescription,
  initialDifficulty,
  problemId,
}: {
  files: nodeSpec[];
  initialFilesContent?: nodeSpec[];
  initialTitle?: string;
  initialDescription?: string;
  initialDifficulty?: string;
  problemId?: number;
}) {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(
    "problem.md"
  );
  const [createdFiles, setCreatedFiles] = useState<Set<string>>(new Set());
  const [lastMarkdownPath, setLastMarkdownPath] =
    useState<string>("problem.md");

  const filesForHook = useMemo(() => {
    const fileSet = new Set<string>();
    for (const ns of files ?? []) {
      if (ns && typeof ns.Files === "object") {
        for (const p of Object.keys(ns.Files as Record<string, string>)) {
          const normalized = p.startsWith("/") ? p.slice(1) : p;
          fileSet.add(normalized);
        }
      }
    }
    return Array.from(fileSet).map((path) => ({
      name: path,
      fileType: (path.endsWith(".go") ? "go" : "markdown") as "go" | "markdown",
    }));
  }, [files]);

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
    setActiveFile,
    setFileContent,
    removeFile,
  } = useProblemEditor(filesForHook, {
    filesContent: initialFilesContent,
    title: initialTitle,
    description: initialDescription,
    difficulty: initialDifficulty,
    problemId,
  });

  // Merge files coming from the `files` prop (nodeSpec[]) into a single map
  const mergedFilesFromProps = useMemo(() => {
    const m: Record<string, string> = {};
    for (const ns of files ?? []) {
      if (ns && typeof ns.Files === "object") {
        for (const raw of Object.keys(ns.Files as Record<string, string>)) {
          const normalized = raw.startsWith("/") ? raw.slice(1) : raw;
          m[normalized] = (ns.Files as Record<string, string>)[raw];
        }
      }
    }
    return m;
  }, [files]);

  // The hook's `filesContent` may be either a flat map or an array of nodeSpec[].
  const mergedFilesFromHook = useMemo(() => {
    // The hook now normalizes file names (no leading slash). Ensure we
    // produce a normalized map as well (strip leading slashes from props just in case).
    if (Array.isArray(filesContent)) {
      const m: Record<string, string> = {};
      for (const ns of filesContent as nodeSpec[]) {
        if (ns && typeof ns.Files === "object") {
          for (const raw of Object.keys(ns.Files as Record<string, string>)) {
            const normalized = raw.startsWith("/") ? raw.slice(1) : raw;
            m[normalized] = (ns.Files as Record<string, string>)[raw];
          }
        }
      }
      return m;
    }
    const fc = filesContent as unknown as Record<string, string>;
    const m: Record<string, string> = {};
    if (fc) {
      for (const raw of Object.keys(fc)) {
        const normalized = raw.startsWith("/") ? raw.slice(1) : raw;
        m[normalized] = fc[raw];
      }
    }
    return m;
  }, [filesContent]);

  const allFilePaths = useMemo(() => {
    return Array.from(
      new Set([
        ...Object.keys(mergedFilesFromHook),
        ...Object.keys(mergedFilesFromProps),
        ...Array.from(createdFiles),
      ])
    );
  }, [mergedFilesFromHook, mergedFilesFromProps, createdFiles]);

  const treeNodes = useMemo(
    () => buildTreeFromPaths(allFilePaths, mergedFilesFromHook),
    [allFilePaths, mergedFilesFromHook]
  );

  const handleAddFile = (folderAndName: string) => {
    const fullPath = folderAndName.startsWith("/")
      ? folderAndName.slice(1)
      : folderAndName;
    if (mergedFilesFromHook[fullPath]) {
      toast.error("File already exists");
      return;
    }
    setCreatedFiles((prev) => new Set([...prev, fullPath]));
    setFileContent(fullPath, "// Start writing code here!");
    setActiveFilePath(fullPath);
    setActiveFile(fullPath);
    toast.success(`Created ${fullPath}`);
  };

  const handleDeleteFile = (filePath: string) => {
    if (!createdFiles.has(filePath)) {
      toast.error("Can only delete newly created files");
      return;
    }
    if (filePath.endsWith(".md")) {
      toast.error("Markdown files cannot be deleted");
      return;
    }

    setCreatedFiles((prev) => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });

    setActiveFilePath((prev) => (prev === filePath ? null : prev));
    removeFile(filePath);
    toast.success(`Deleted ${filePath}`);
  };

  const handleFileClick = (file: FileNode) => {
    setActiveFilePath(file.path);
    setActiveFile(file.path);
    if (file.name.endsWith(".md")) {
      setLastMarkdownPath(file.path);
    }
  };

  const activeFile = activeFilePath
    ? (treeNodes.flatMap(flattenTree).find((f) => f.path === activeFilePath) ??
      null)
    : null;

  const previewContent = mergedFilesFromHook[lastMarkdownPath] ?? "";

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
              <SelectTrigger className="w-full text-base font-medium hover:cursor-pointer">
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
                <SelectItem
                  value="1"
                  className={"text-chart-2 font-semibold hover:cursor-pointer"}
                >
                  Easy
                </SelectItem>
                <SelectItem
                  value="2"
                  className={"text-chart-3 font-semibold hover:cursor-pointer"}
                >
                  Medium
                </SelectItem>
                <SelectItem
                  value="3"
                  className={"text-primary font-semibold hover:cursor-pointer"}
                >
                  Hard
                </SelectItem>
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
                  file={{
                    name: activeFile.name,
                    fileType: activeFile.name.endsWith(".go")
                      ? "go"
                      : "markdown",
                    content: activeFile.content,
                    path: activeFile.path,
                  }}
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
