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
import { ConfirmationDialog } from "@/components/custom/alert-dialog";
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
import type { FileNode } from "@/lib/folderStructure";
import {
  buildTreeFromPaths,
  FilteredTreeNode,
  flattenTree,
} from "./folder-structure";

type EditableFileNode = FileNode & { readOnly?: boolean };

type ExerciseEditorProps = {
  exerciseId: number;
  problemMarkdown: string;
  solutionMarkdown: string;
  codeFolder: nodeSpec[];
  savedCode?: nodeSpec[];
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
    "/student/main.go"
  );
  // Normalize incoming nodeSpec arrays so file paths consistently start with a leading '/'
  const normalizeNodeSpecs = (arr: nodeSpec[] | undefined) => {
    if (!arr) return [] as nodeSpec[];
    return arr.map((ns) => {
      if (!ns || !ns.Files) return ns;
      const Files = Object.fromEntries(
        Object.entries(ns.Files).map(([p, v]) => [
          p.startsWith("/") ? p : `/${p}`,
          v,
        ])
      );
      return { ...ns, Files } as nodeSpec;
    });
  };

  const [fileContents, setFileContents] = useState<nodeSpec[]>(() =>
    normalizeNodeSpecs(savedCode ?? codeFolder)
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
    const studentFiles =
      fileContents.find((ns) => String(ns?.Alias).toLowerCase() === "student")
        ?.Files || {};

    const templateFiles = Object.entries(studentFiles)
      .filter(([path]) => path.startsWith("/student"))
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
      content: (() => {
        // find content in nodeSpec[] for this path
        for (const ns of fileContents) {
          if (ns?.Files && ns.Files[path] !== undefined) return ns.Files[path];
        }
        return "// Start writing code here!";
      })(),
      readOnly: false,
    }));

    return [...templateFiles, ...newFiles];
  }, [createdFiles, fileContents]);

  const problemWithProtocol = useMemo(() => {
    const protocolCode =
      fileContents.find((ns) => String(ns?.Alias).toLowerCase() === "root")
        ?.Files["protocol.go"] ?? "// protocol.go missing";
    return `${problemMarkdown}
\n\n# These are the protocols for the exercise:
\`\`\`go
${protocolCode}
\`\`\``;
  }, [problemMarkdown, fileContents]);

  const { connect, clearMessages } = useSSE<nodeSpec>("/api/stream");

  const setEditorContent = (
    value: string | ((prev: string) => string),
    filePath: string
  ) => {
    if (resetting) return;
    const file = files.find((f) => f.path === filePath);
    if (file?.readOnly) return;
    const compute = (prevContent: string | undefined) =>
      typeof value === "function" ? value(prevContent || "") : value;

    setFileContents((prev) => {
      let found = false;
      const next = prev.map((ns) => {
        if (ns?.Files && Object.hasOwn(ns.Files, filePath)) {
          found = true;
          return {
            ...ns,
            Files: {
              ...ns.Files,
              [filePath]: compute(ns.Files[filePath]),
            },
          } as nodeSpec;
        }
        return ns;
      });

      if (found) return next;

      // If not found, add to Student namespace (create if missing)
      const studentIdx = prev.findIndex(
        (ns) => String(ns?.Alias).toLowerCase() === "student"
      );
      if (studentIdx >= 0) {
        const student = prev[studentIdx];
        const updatedStudent = {
          ...student,
          Files: {
            ...student.Files,
            [filePath]: compute(undefined),
          },
        } as nodeSpec;
        return prev.map((ns, i) => (i === studentIdx ? updatedStudent : ns));
      }

      // No Student namespace found — append one
      return [
        ...prev,
        {
          Alias: "Student",
          Files: { [filePath]: compute(undefined) },
        } as nodeSpec,
      ];
    });
  };

  const onSubmit = async () => {
    clearMessages();
    connect();

    // submit the nodeSpec[] state so server receives updated namespaces/files
    const result = await submitCode(fileContents, {
      params: { id: exerciseId },
    });
    if (result?.error) toast.error(`Error submitting: ${result.error}`);
    else toast.success("Code submitted successfully!");
    setCanRate(true);
  };

  const onSave = async () => {
    // send nodeSpec[] (fileContents) to save
    const result = await saveCode(fileContents, { params: { id: exerciseId } });
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

      // Normalize template keys to ensure consistent leading '/'
      const templateFiles: Record<string, string> = Object.fromEntries(
        Object.entries(result.template)
          .filter(([path]) => path.startsWith("/student"))
          .map(([path, content]) => [path, String(content)])
      );

      // replace Student namespace Files with templateFiles, keep other namespaces
      setFileContents((prev) => {
        const studentIdx = prev.findIndex(
          (ns) => String(ns?.Alias).toLowerCase() === "student"
        );
        if (studentIdx >= 0) {
          return prev.map((ns, i) =>
            i === studentIdx
              ? ({ ...ns, Files: templateFiles } as nodeSpec)
              : ns
          );
        }

        return [
          ...prev,
          { Alias: "Student", Files: templateFiles } as nodeSpec,
        ];
      });

      setCreatedFiles(new Set());
      setActiveFilePath("/student/main.go");
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

  const treeNodes = useMemo(() => {
    const studentFiles =
      fileContents.find((ns) => String(ns?.Alias).toLowerCase() === "student")
        ?.Files || {};
    const templatePaths = Object.keys(studentFiles);
    return buildTreeFromPaths(templatePaths, studentFiles);
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

    // simple existence check inside nodeSpec[]
    const exists = fileContents.some(
      (ns) => ns?.Files && Object.hasOwn(ns.Files, fullPath)
    );
    if (exists) {
      toast.error("File already exists");
      return;
    }

    // add to createdFiles set
    setCreatedFiles((prev) => new Set([...prev, fullPath]));

    // add file into Student namespace
    setFileContents((prev) => {
      const studentIdx = prev.findIndex(
        (ns) => String(ns?.Alias).toLowerCase() === "student"
      );
      if (studentIdx >= 0) {
        return prev.map((ns, i) =>
          i === studentIdx
            ? ({
                ...ns,
                Files: {
                  ...ns.Files,
                  [fullPath]: "// Start writing your code here!",
                },
              } as nodeSpec)
            : ns
        );
      }
      // no Student namespace — append one
      return [
        ...prev,
        {
          Alias: "Student",
          Files: { [fullPath]: "// Start writing your code here!" },
        } as nodeSpec,
      ];
    });
    setActiveFilePath(fullPath);
    toast.success(`Created ${fullPath}`);
  };

  const onDeleteFile = (filePath: string) => {
    setCreatedFiles((prev) => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
    setFileContents((prev) =>
      prev.map((ns) => {
        if (ns?.Files && Object.hasOwn(ns.Files, filePath)) {
          const nextFiles = Object.fromEntries(
            Object.entries(ns.Files).filter(([p]) => p !== filePath)
          );
          return { ...ns, Files: nextFiles } as nodeSpec;
        }
        return ns;
      })
    );
    if (activeFilePath === filePath) setActiveFilePath(null);
    toast.success(`Deleted ${filePath}`);
  };

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
                  <MarkdownPreview content={solutionMarkdown} />
                )}
              </div>
            </div>
          </>
        )}
      </ResizablePanel>

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
            onFileClick={(file) => {
              if (file.type === "file") setActiveFilePath(file.path);
            }}
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
              className="mr-2 hover:cursor-pointer"
              onClick={() => onRate(true)}
              disabled={ratingLoading}
            >
              <ThumbsUp className="w-4 h-4 mr-1" /> Like
            </Button>
            <Button
              size="sm"
              variant={userRating === "down" ? "default" : "outline"}
              className="mr-2 hover:cursor-pointer"
              onClick={() => onRate(false)}
              disabled={ratingLoading}
            >
              <ThumbsDown className="w-4 h-4 mr-1" /> Dislike
            </Button>
          </div>
          <EditorHeader
            onSubmitAction={onSubmit}
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
                  content: (() => {
                    for (const ns of fileContents) {
                      if (ns?.Files && ns.Files[activeFile.path] !== undefined)
                        return ns.Files[activeFile.path];
                    }
                    return "";
                  })(),
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

      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Code?"
        description="This will delete all your changes and restore the original template files."
        onConfirm={confirmReset}
      />

      <ConfirmationDialog
        open={showUnlockDialog}
        onOpenChange={setShowUnlockDialog}
        title="Unlock Solution?"
        description="Once unlocked, the solution will be visible. This action cannot be undone."
        onConfirm={confirmUnlockSolution}
      />
    </ResizablePanelGroup>
  );
}
