"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  rateExercise,
  resetCode,
  saveCode,
  submitCode,
} from "@/app/exercises/[id]/actions";
import { ResetDialog } from "@/components/custom/alert-dialog";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { nodeSpec } from "@/drizzle/schema";
import { useSSE } from "@/hooks/useSSE";
import type { FileNode, Node } from "@/lib/folderStructure";
import { FilteredTreeNode } from "./folder-structure";
import { buildTreeFromPaths } from "./problemEditorClient";

/* ---------------- HELPERS ---------------- */
function flattenTree(node: Node): FileNode[] {
  if (node.type === "file") return [node];
  return node.children.flatMap(flattenTree);
}

type EditableFileNode = FileNode & { readOnly?: boolean };

type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  solutionMarkdown: string;
  codeFolder: nodeSpec;
  savedCode?: nodeSpec;
  userRating?: "up" | "down" | null;
  canRate?: boolean;
};

export default function ExerciseEditor({
  exerciseId,
  problemMarkdown,
  solutionMarkdown,
  codeFolder,
  savedCode,
  userRating: initialUserRating = null,
  canRate: initialCanRate = false,
}: ExerciseEditorProps) {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(
    "/template/main.go"
  );
  const [fileContents, setFileContents] = useState<Record<string, string>>(
    () => {
      return (
        savedCode?.Files ??
        Object.fromEntries(
          Object.entries(codeFolder.Files)
            .filter(([path]) => path.startsWith("/template"))
            .map(([path, content]) => [path, content])
        )
      );
    }
  );

  const [createdFiles, setCreatedFiles] = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState(false);
  const [userRating, setUserRating] = useState<"up" | "down" | null>(
    initialUserRating
  );
  const [canRate, setCanRate] = useState(initialCanRate);
  const [ratingLoading, startRatingTransition] = useTransition();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightTab, setRightTab] = useState<"problem" | "solution">("problem");
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);
  const horizontalGroupId = useId();
  const verticalGroupId = useId();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const confirmUnlockSolution = () => {
    setSolutionUnlocked(true);
    setRightTab("solution");
  };

  const files: EditableFileNode[] = useMemo(() => {
    const templateFiles = Object.entries(codeFolder.Files)
      .filter(([path]) => path.startsWith("/template"))
      .map(([path, content]) => ({
        type: "file" as const,
        path,
        name: path.split("/").pop() || path,
        content,
        readOnly: false,
      }));

    const newFiles = Array.from(createdFiles).map((path) => ({
      type: "file" as const,
      path,
      name: path.split("/").pop() || path,
      content: fileContents[path] || "// New file",
      readOnly: false,
    }));

    return [...templateFiles, ...newFiles];
  }, [codeFolder.Files, createdFiles, fileContents]);

  const problemWithProtocol = useMemo(() => {
    const protocolCode =
      codeFolder.Files["/proto/protocol.go"] ?? "// protocol.go missing";
    return `${problemMarkdown}
\n\nThese are the protocols for the exercise:
\`\`\`go
${protocolCode}
\`\`\``;
  }, [problemMarkdown, codeFolder.Files]);

  const { connect, clearMessages } = useSSE<nodeSpec>("/api/stream");

  const setEditorContent = (
    value: string | ((prev: string) => string),
    filePath: string
  ) => {
    if (resetting) return;
    const file = files.find((f) => f.path === filePath);
    if (file?.readOnly) return;
    setFileContents((prev) => ({
      ...prev,
      [filePath]:
        typeof value === "function" ? value(prev[filePath] || "") : value,
    }));
  };

  /* ---------------- SUBMIT / SAVE / RESET ---------------- */
  const onSubmit = async () => {
    clearMessages();
    connect();
    const payload: nodeSpec = {
      Files: fileContents,
      Envs: codeFolder.Envs,
      BuildCommand: codeFolder.BuildCommand,
      EntryCommand: codeFolder.EntryCommand,
    };
    const result = await submitCode(payload, { params: { id: exerciseId } });
    if (result?.error) toast.error(`Error submitting: ${result.error}`);
    else toast.success("Code submitted successfully!");
    setCanRate(true);
  };

  const onSave = async () => {
    const payload: nodeSpec = {
      Files: fileContents,
      Envs: codeFolder.Envs,
      BuildCommand: codeFolder.BuildCommand,
      EntryCommand: codeFolder.EntryCommand,
    };
    const result = await saveCode(payload, { params: { id: exerciseId } });
    if (result?.error) toast.error(`Error saving code: ${result.error}`);
    else toast.success("Code saved successfully!");
    setCanRate(true);
  };

  const onReset = async () => {
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    setResetting(true);

    try {
      const result = await resetCode({ params: { id: exerciseId } });

      if (!result.success || !result.template) {
        toast.error(result.error || "Failed to fetch template");
        setResetting(false);
        return;
      }

      const templateFiles: Record<string, string> = Object.fromEntries(
        Object.entries(result.template.Files)
          .filter(([path]) => path.startsWith("/template"))
          .map(([path, content]) => [path, String(content)])
      );

      setFileContents(templateFiles);
      setCreatedFiles(new Set());
      setActiveFilePath("/template/main.go");
      toast.success("Code reset successfully!");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setResetting(false);
    }
  };

  const onRate = async (liked: boolean) => {
    if (!canRate) {
      toast.error("You can only rate after submitting!");
      return;
    }
    startRatingTransition(async () => {
      const result = await rateExercise({ params: { id: exerciseId } }, liked);
      if (result?.error) toast.error(result.error);
      else {
        setUserRating(liked ? "up" : "down");
        toast.success(`You rated this exercise ${liked ? "👍" : "👎"}`);
      }
    });
  };

  /* ---------------- TREE ---------------- */
  const treeNodes = useMemo(() => {
    const templatePaths = Object.keys(fileContents).filter((path) =>
      path.startsWith("/template")
    );
    return buildTreeFromPaths(templatePaths, fileContents);
  }, [fileContents]);
  const activeFile: EditableFileNode | null = activeFilePath
    ? (flattenTree({ type: "folder", name: "root", children: treeNodes }).find(
        (f) => f.path === activeFilePath
      ) as EditableFileNode)
    : null;

  const onAddFile = (folderAndName: string) => {
    const fullPath = folderAndName.startsWith("/")
      ? folderAndName
      : `/${folderAndName}`;

    if (fileContents[fullPath]) {
      toast.error("File already exists");
      return;
    }

    setCreatedFiles((prev) => new Set([...prev, fullPath]));
    setFileContents((prev) => ({ ...prev, [fullPath]: "// New file" }));
    setActiveFilePath(fullPath);
    toast.success(`Created ${fullPath}`);
  };

  const onDeleteFile = (filePath: string) => {
    setCreatedFiles((prev) => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
    setFileContents((prev) => {
      const { [filePath]: _, ...rest } = prev;
      return rest;
    });
    if (activeFilePath === filePath) setActiveFilePath(null);
    toast.success(`Deleted ${filePath}`);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="flex-1 border relative"
      id={horizontalGroupId}
    >
      {/* LEFT PANEL — PROBLEM / SOLUTION */}
      <ResizablePanel
        minSize={30}
        className={`overflow-y-auto transition-all duration-200 relative ${leftPanelOpen ? "" : "hidden"}`}
        data-panel-group-id={horizontalGroupId}
      >
        {leftPanelOpen && (
          <>
            {/* Collapse button */}
            <Button
              size="sm"
              variant="outline"
              className="absolute top-1/2 -translate-y-1/2 right-2 z-20"
              onClick={() => setLeftPanelOpen(false)}
            >
              <ChevronLeft size={16} />
            </Button>

            <div className="flex flex-col h-full">
              <div className="flex border-b bg-background pl-2.5">
                <Button
                  variant={rightTab === "problem" ? "default" : "secondary"}
                  size="sm"
                  className="rounded-none border-r hover:cursor-pointer"
                  onClick={() => setRightTab("problem")}
                >
                  <BookOpen className="w-4 h-4 mr-2" /> Problem
                </Button>
                <Button
                  variant={rightTab === "solution" ? "default" : "secondary"}
                  size="sm"
                  className="rounded-none border-r hover:cursor-pointer"
                  onClick={() => {
                    if (!solutionUnlocked) {
                      setShowUnlockDialog(true);
                      return;
                    }
                    setRightTab("solution");
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" /> Solution
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {rightTab === "problem" && (
                  <MarkdownPreview content={problemWithProtocol} />
                )}
                {rightTab === "solution" && (
                  <Editor
                    file={{
                      path: "solution.go",
                      name: "solution.go",
                      fileType: "markdown",
                      content: solutionMarkdown,
                    }}
                    setEditorContent={() => {}}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      lineNumbers: "on",
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </ResizablePanel>

      {/* Expand button when left panel is collapsed */}
      {!leftPanelOpen && (
        <Button
          size="sm"
          variant="outline"
          className="absolute top-1/2 -translate-y-1/2 left-2 z-20"
          onClick={() => setLeftPanelOpen(true)}
        >
          <ChevronRight size={16} />
        </Button>
      )}

      <ResizableHandle withHandle data-panel-group-id={horizontalGroupId} />

      {/* MIDDLE PANEL — FILE TREE */}
      <ResizablePanel
        minSize={20}
        className="overflow-y-auto p-2 border-l"
        data-panel-group-id={horizontalGroupId}
      >
        {treeNodes.map((node) => (
          <FilteredTreeNode
            key={node.type === "file" ? node.path : node.name}
            node={node}
            onFileClick={() =>
              setActiveFilePath(node.type === "file" ? node.path : "")
            }
            onAddFile={onAddFile}
            onDeleteFile={onDeleteFile}
            activeFilePath={activeFilePath}
          />
        ))}
      </ResizablePanel>

      <ResizableHandle withHandle data-panel-group-id={horizontalGroupId} />

      {/* RIGHT PANEL — EDITOR + TERMINAL */}
      <ResizablePanel minSize={50} data-panel-group-id={horizontalGroupId}>
        <div className="flex justify-end">
          <div className="flex items-center p-2 space-x-2">
            <Button
              size="sm"
              variant={userRating === "up" ? "default" : "outline"}
              className="mr-2"
              onClick={() => onRate(true)}
              disabled={ratingLoading}
            >
              <ThumbsUp className="w-4 h-4 mr-1" /> Like
            </Button>
            <Button
              size="sm"
              variant={userRating === "down" ? "default" : "outline"}
              className="mr-2"
              onClick={() => onRate(false)}
              disabled={ratingLoading}
            >
              <ThumbsDown className="w-4 h-4 mr-1" /> Dislike
            </Button>
          </div>
          <EditorHeader
            onSubmit={onSubmit}
            onSaveAction={onSave}
            onResetAction={onReset}
            disabled={resetting}
          />
        </div>

        <ResizablePanelGroup direction="vertical" id={verticalGroupId}>
          <ResizablePanel
            defaultSize={60}
            className="relative"
            data-panel-group-id={verticalGroupId}
          >
            {activeFile && (
              <Editor
                file={{
                  path: activeFile.path,
                  name: activeFile.name,
                  fileType: activeFile.path.endsWith(".go") ? "go" : "markdown",
                  content: fileContents[activeFile.path] || "",
                }}
                setEditorContent={(val) =>
                  setEditorContent(val, activeFile.path)
                }
                options={{
                  readOnly: resetting || activeFile.readOnly,
                  minimap: { enabled: false },
                }}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResetDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Code?"
        description="This will delete all your changes and restore the original template files."
        onConfirm={confirmReset}
      />

      <ResetDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        title="Unlock Solution?"
        description="Once unlocked, the solution will be visible. This action cannot be undone."
        onConfirm={confirmUnlockSolution}
      />
    </ResizablePanelGroup>
  );
}
