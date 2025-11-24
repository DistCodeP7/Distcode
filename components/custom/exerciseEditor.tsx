"use client";

import { BookOpen, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { StreamingJobResult } from "@/app/api/stream/route";
import {
    rateExercise,
    resetCode,
    saveCode,
    submitCode,
} from "@/app/exercises/[id]/actions";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { TerminalOutput } from "@/components/custom/TerminalOutput";
import { Button } from "@/components/ui/button";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { nodeSpec } from "@/drizzle/schema";
import { useSSE } from "@/hooks/useSSE";
import type { FileNode, Node } from "./problemEditorClient";
import { buildTreeFromPaths } from "./problemEditorClient";
import { FilteredTreeNode } from "./folder-structure";

/* ---------------- HELPERS ---------------- */
function flattenTree(node: Node): FileNode[] {
    if (node.type === "file") return [node];
    return node.children.flatMap(flattenTree);
}

/* ---------------- MAIN ---------------- */

type EditableFileNode = FileNode & {
    readOnly?: boolean;
};

type ExerciseEditorProps = {
    exerciseId: number;
    problemMarkdown: string;
    solutionMarkdown: string;
    codeFolder: nodeSpec;
    userRating?: "up" | "down" | null;
    canRate?: boolean;
};

export default function ExerciseEditor({
                                           exerciseId,
                                           problemMarkdown,
                                           solutionMarkdown,
                                           codeFolder,
                                           userRating: initialUserRating = null,
                                           canRate: initialCanRate = false,
                                       }: ExerciseEditorProps) {
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [userRating, setUserRating] = useState<"up" | "down" | null>(
        initialUserRating
    );
    const [canRate, setCanRate] = useState(initialCanRate);
    const [ratingLoading, startRatingTransition] = useTransition();
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [viewingSolution, setViewingSolution] = useState(false);

    const horizontalGroupId = useId();
    const verticalGroupId = useId();

    const [createdFiles, setCreatedFiles] = useState<Set<string>>(new Set());
    const addTemplateFile = (name: string) => {
        const path = `/template/${name}`;
        if (fileContents[path]) {
            toast.error("File already exists!");
            return;
        }

        // Add file to state
        setFileContents((prev) => ({ ...prev, [path]: "" }));
        setCreatedFiles((prev) => new Set(prev).add(path));
        setActiveFilePath(path); // optionally open the new file
    };
    const removeTemplateFile = (path: string) => {
        if (path === "/template/main.go") {
            toast.error("Cannot delete main.go");
            return;
        }
        if (!createdFiles.has(path)) {
            toast.error("Cannot delete this file");
            return;
        }

        // Remove from state
        setFileContents((prev) => {
            const copy = { ...prev };
            delete copy[path];
            return copy;
        });
        setCreatedFiles((prev) => {
            const copy = new Set(prev);
            copy.delete(path);
            return copy;
        });

        // If active file is deleted, unset it
        if (activeFilePath === path) setActiveFilePath(null);
    };



    const [solutionUnlocked, setSolutionUnlocked] = useState(false);

    // --- Files setup ---
    const files: EditableFileNode[] = useMemo(
        () =>
            Object.entries(codeFolder.files)
                .filter(
                    ([path]) =>
                        path.startsWith("/template") ||
                        path.startsWith("/proto")
                )
                .map(([path, content]) => ({
                    type: "file",
                    path,
                    name: path.split("/").pop() || path,
                    content,
                    readOnly: path === "/proto/protocol.go",
                })),
        [codeFolder.files]
    );

    const [fileContents, setFileContents] = useState<Record<string, string>>(
        () => Object.fromEntries(files.map((f) => [f.path, f.content]))
    );

    const { messages, connect, clearMessages } =
        useSSE<StreamingJobResult>("/api/stream");

    const setEditorContent = (
        value: string | ((prev: string) => string),
        filePath: string
    ) => {
        if (resetting) return;
        const file = files.find((f) => f.path === filePath);
        if (file?.readOnly) return; // locked

        setFileContents((prev) => ({
            ...prev,
            [filePath]:
                typeof value === "function" ? value(prev[filePath] || "") : value,
        }));
    };

    // --- Submit / Save / Reset ---
    const onSubmit = async () => {
        clearMessages();
        connect();
        const payload: nodeSpec = { files: fileContents, envs: codeFolder.envs };
        await submitCode(payload, { params: { id: exerciseId } });
        setCanRate(true);
    };

    const onSave = async () => {
        clearMessages();
        const payload: nodeSpec = { files: fileContents, envs: codeFolder.envs };
        const result = await saveCode(payload, { params: { id: exerciseId } });
        if (result.error) toast.error(`Error saving code: ${result.error}`);
        else toast.success("Code saved successfully!");
        setCanRate(true);
    };

    const onReset = async () => {
        if (!window.confirm("Are you sure you want to reset your code?")) return;
        setResetting(true);
        try {
            const templateFiles = files.filter((f) => f.path.startsWith("/template"));
            const newContents = Object.fromEntries(
                templateFiles.map((f) => [f.path, f.content])
            );
            setFileContents(newContents);
            toast.success("Code reset successfully!");
        } catch (err) {
            toast.error(String(err));
        } finally {
            setResetting(false);
        }
    };

    const treeNodes = useMemo(
        () =>
            buildTreeFromPaths(
                files.map((f) => f.path),
                fileContents
            ),
        [files, fileContents]
    );

    const activeFile: EditableFileNode | null =
        activeFilePath != null
            ? (flattenTree({ type: "folder", name: "root", children: treeNodes }).find(
            (f) => f.path === activeFilePath
        ) as EditableFileNode | undefined) ?? null
            : null;

    return (
        <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 border relative"
            id={horizontalGroupId}
        >
            {/* Left Panel */}
            <ResizablePanel
                minSize={20}
                className="overflow-y-auto p-2 border-l"
                data-panel-group-id={horizontalGroupId}
            >
                {treeNodes.map((node) => (
                    <FilteredTreeNode
                        key={node.type === "file" ? node.path : node.name}
                        node={node}
                        onFileClick={(file) => setActiveFilePath(file.path)}
                        activeFilePath={activeFilePath}
                    />
                ))}
            </ResizablePanel>

            <ResizableHandle withHandle data-panel-group-id={horizontalGroupId} />

            {/* Middle Panel */}
            <ResizablePanel minSize={20} data-panel-group-id={horizontalGroupId}>
                <ResizablePanelGroup
                    direction="vertical"
                    id={verticalGroupId}
                >
                    <ResizablePanel
                        defaultSize={60}
                        className="relative"
                        data-panel-group-id={verticalGroupId}
                    >
                        {activeFile && (
                            <Editor
                                file={activeFile}
                                setEditorContent={(val) => {
                                    if (activeFile.readOnly || resetting) return;
                                    setEditorContent(val, activeFile.path);
                                }}
                                options={{
                                    readOnly: resetting || activeFile.readOnly,
                                    minimap: { enabled: false },
                                }}
                            />

                        )}

                        {resetting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
                                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>Resetting to starter code...</span>
                                </div>
                            </div>
                        )}

                        {/* Toggle Right Panel */}
                        <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-0 z-20"
                            onClick={() => setRightPanelOpen((prev) => !prev)}
                        >
                            {rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </Button>
                    </ResizablePanel>

                    <ResizableHandle withHandle data-panel-group-id={verticalGroupId} />

                    <ResizablePanel
                        defaultSize={40}
                        data-panel-group-id={verticalGroupId}
                    >
                        <TerminalOutput messages={messages} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle data-panel-group-id={horizontalGroupId} />

            {/* Right Panel */}
            <ResizablePanel
                minSize={rightPanelOpen ? 20 : 0}
                defaultSize={rightPanelOpen ? 30 : 0}
                className={`overflow-y-auto transition-all duration-200 ${
                    rightPanelOpen ? "" : "hidden"
                }`}
                data-panel-group-id={horizontalGroupId}
            >
                {rightPanelOpen && (
                    <>
                        <EditorHeader
                            onSubmit={onSubmit}
                            onSave={onSave}
                            onReset={onReset}
                            disabled={resetting}
                        />

                        <div className="flex flex-col h-full">
                            <div className="flex border-b bg-background">
                                {/* Problem Tab */}
                                <Button
                                    variant={!viewingSolution ? "default" : "secondary"}
                                    size="sm"
                                    className="rounded-none border-r hover:cursor-pointer"
                                    onClick={() => setViewingSolution(false)}
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Problem
                                </Button>

                                {/* Solution Tab */}
                                <Button
                                    variant={viewingSolution ? "default" : "secondary"}
                                    size="sm"
                                    className="rounded-none border-r hover:cursor-pointer"
                                    onClick={() => {
                                        if (!solutionUnlocked) {
                                            if (!window.confirm("Are you sure you want to view the solution?")) return;
                                            setSolutionUnlocked(true);
                                        }
                                        setViewingSolution(true);
                                    }}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Solution
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {viewingSolution ? (
                                    <MarkdownPreview content={solutionMarkdown} />
                                ) : (
                                    <MarkdownPreview content={problemMarkdown} />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}