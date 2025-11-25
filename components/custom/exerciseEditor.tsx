"use client";

import { BookOpen, FileText, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { useId, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import type { nodeSpec } from "@/drizzle/schema";
import { rateExercise, resetCode, saveCode, submitCode } from "@/app/exercises/[id]/actions";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import { TerminalOutput } from "@/components/custom/TerminalOutput";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useSSE } from "@/hooks/useSSE";
import type { FileNode, Node } from "./problemEditorClient";
import { buildTreeFromPaths } from "./problemEditorClient";
import { FilteredTreeNode } from "./folder-structure";
import {StreamingJobResult} from "@/app/api/stream/route";

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
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
        const initial = savedCode?.files ?? Object.fromEntries(
            Object.entries(codeFolder.files)
                .filter(([path]) => path.startsWith("/template"))
                .map(([path, content]) => [path, content])
        );
        return initial;
    });

    const [createdFiles, setCreatedFiles] = useState<Set<string>>(new Set());
    const [resetting, setResetting] = useState(false);
    const [userRating, setUserRating] = useState<"up" | "down" | null>(initialUserRating);
    const [canRate, setCanRate] = useState(initialCanRate);
    const [ratingLoading, startRatingTransition] = useTransition();
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [rightTab, setRightTab] = useState<"problem" | "solution" | "protocol">("problem");
    const [solutionUnlocked, setSolutionUnlocked] = useState(false);
    const horizontalGroupId = useId();
    const verticalGroupId = useId();

    const files: EditableFileNode[] = useMemo(() => {
        const templateFiles = Object.entries(codeFolder.files)
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
    }, [codeFolder.files, createdFiles, fileContents]);

    const protocolContent = codeFolder.files["/proto/protocol.go"] ?? "// protocol.go missing";
    const { messages, connect, clearMessages } = useSSE<nodeSpec>("/api/stream");

    const setEditorContent = (value: string | ((prev: string) => string), filePath: string) => {
        if (resetting) return;
        const file = files.find((f) => f.path === filePath);
        if (file?.readOnly) return;
        setFileContents(prev => ({
            ...prev,
            [filePath]: typeof value === "function" ? value(prev[filePath] || "") : value,
        }));
    };

    /* ---------------- SUBMIT / SAVE / RESET ---------------- */
    const onSubmit = async () => {
        clearMessages();
        connect();
        const payload: nodeSpec = { files: fileContents, envs: codeFolder.envs };
        const result = await submitCode(payload, { params: { id: exerciseId } });
        if (result?.error) toast.error(`Error submitting: ${result.error}`);
        else toast.success("Code submitted successfully!");
        setCanRate(true);
    };

    const onSave = async () => {
        const payload: nodeSpec = { files: fileContents, envs: codeFolder.envs };
        const result = await saveCode(payload, { params: { id: exerciseId } });
        if (result?.error) toast.error(`Error saving code: ${result.error}`);
        else toast.success("Code saved successfully!");
        setCanRate(true);
    };

    const onReset = async () => {
        if (!window.confirm("Are you sure you want to reset your code?")) return;
        setResetting(true);
        try {
            const templateFiles = Object.entries(codeFolder.files)
                .filter(([path]) => path.startsWith("/template"))
                .reduce((acc, [path, content]) => ({ ...acc, [path]: content }), {} as Record<string, string>);

            setFileContents(templateFiles);
            setCreatedFiles(new Set());
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
        const allPaths = Object.keys(fileContents);
        return buildTreeFromPaths(allPaths, fileContents);
    }, [fileContents]);
    const activeFile: EditableFileNode | null = activeFilePath
        ? flattenTree({ type: "folder", name: "root", children: treeNodes }).find(f => f.path === activeFilePath) as EditableFileNode
        : null;

    const onAddFile = (folderAndName: string) => {
        const fullPath = folderAndName.startsWith("/") ? folderAndName : `/${folderAndName}`;

        if (fileContents[fullPath]) {
            toast.error("File already exists");
            return;
        }

        setCreatedFiles(prev => new Set([...prev, fullPath]));
        setFileContents(prev => ({ ...prev, [fullPath]: "// New file" }));
        setActiveFilePath(fullPath); // automatically select/open the new file
        toast.success(`Created ${fullPath}`);
    };


    const onDeleteFile = (filePath: string) => {
        if (!createdFiles.has(filePath)) {
            toast.error("You can only delete files you created");
            return;
        }
        setCreatedFiles(prev => {
            const next = new Set(prev);
            next.delete(filePath);
            return next;
        });
        setFileContents(prev => {
            const { [filePath]: _, ...rest } = prev;
            return rest;
        });
        if (activeFilePath === filePath) setActiveFilePath(null);
        toast.success(`Deleted ${filePath}`);
    };


    /* ---------------- RENDER ---------------- */
    return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 border relative" id={horizontalGroupId}>
            {/* LEFT PANEL — FILE TREE */}
            <ResizablePanel minSize={20} className="overflow-y-auto p-2 border-l" data-panel-group-id={horizontalGroupId}>
                {treeNodes.map(node => (
                    <FilteredTreeNode
                        key={node.type === "file" ? node.path : node.name}
                        node={node}
                        onFileClick={f => setActiveFilePath(f.path)}
                        onAddFile={onAddFile}
                        onDeleteFile={onDeleteFile}
                        activeFilePath={activeFilePath}
                    />
                ))}
            </ResizablePanel>

            <ResizableHandle withHandle data-panel-group-id={horizontalGroupId} />

            {/* MIDDLE PANEL — EDITOR + TERMINAL */}
            <ResizablePanel minSize={20} data-panel-group-id={horizontalGroupId}>
                <ResizablePanelGroup direction="vertical" id={verticalGroupId}>
                    <ResizablePanel defaultSize={60} className="relative" data-panel-group-id={verticalGroupId}>
                        {activeFile && (
                            <Editor
                                file={activeFile}
                                setEditorContent={val => setEditorContent(val, activeFile.path)}
                                options={{ readOnly: resetting || activeFile.readOnly, minimap: { enabled: false } }}
                            />
                        )}

                        <Button size="sm" variant="outline" className="absolute top-2 right-0 z-20" onClick={() => setRightPanelOpen(prev => !prev)}>
                            {rightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </Button>
                    </ResizablePanel>

                    <ResizableHandle withHandle data-panel-group-id={verticalGroupId} />

                    <ResizablePanel defaultSize={40} data-panel-group-id={verticalGroupId}>
                        <TerminalOutput messages={messages as unknown as StreamingJobResult[]} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle data-panel-group-id={horizontalGroupId} />

            {/* RIGHT PANEL — PROBLEM / SOLUTION / PROTOCOL */}
            <ResizablePanel
                minSize={rightPanelOpen ? 20 : 0}
                defaultSize={rightPanelOpen ? 30 : 0}
                className={`overflow-y-auto transition-all duration-200 ${rightPanelOpen ? "" : "hidden"}`}
                data-panel-group-id={horizontalGroupId}
            >
                {rightPanelOpen && (
                    <>
                        <EditorHeader onSubmit={onSubmit} onSave={onSave} onReset={onReset} disabled={resetting} />

                        <div className="flex flex-col h-full">
                            {/* Tabs */}
                            <div className="flex border-b bg-background">
                                <Button variant="default" size="sm" className="rounded-none border-r" onClick={() => setRightTab("problem")}>
                                    <BookOpen className="w-4 h-4 mr-2" /> Problem
                                </Button>
                                <Button variant={rightTab === "protocol" ? "default" : "secondary"} size="sm" className="rounded-none" onClick={() => setRightTab("protocol")}>
                                    <FileText className="w-4 h-4 mr-2" /> Protocols
                                </Button>
                                <Button
                                    variant={rightTab === "solution" ? "default" : "secondary"}
                                    size="sm"
                                    className="rounded-none border-r"
                                    onClick={() => {
                                        if (!solutionUnlocked) {
                                            if (!window.confirm("Are you sure you want to view the solution?")) return;
                                            setSolutionUnlocked(true);
                                        }
                                        setRightTab("solution");
                                    }}
                                >
                                    <FileText className="w-4 h-4 mr-2" /> Solution
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {rightTab === "problem" && <MarkdownPreview content={problemMarkdown} />}
                                {rightTab === "protocol" && (
                                    <Editor file={{ path: "protocol.go", name: "protocol.go", type: "file", content: protocolContent }} setEditorContent={() => {}} options={{ readOnly: true, minimap: { enabled: false }, lineNumbers: "on" }} />
                                )}
                                {rightTab === "solution" && (
                                    <Editor file={{ path: "solution.go", name: "solution.go", type: "file", content: solutionMarkdown }} setEditorContent={() => {}} options={{ readOnly: true, minimap: { enabled: false }, lineNumbers: "on" }} />
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" variant={userRating === "up" ? "default" : "secondary"} onClick={() => onRate(true)} disabled={!canRate || ratingLoading}>
                                    <ThumbsUp className="w-4 h-4 mr-1" /> Up
                                </Button>
                                <Button size="sm" variant={userRating === "down" ? "default" : "secondary"} onClick={() => onRate(false)} disabled={!canRate || ratingLoading}>
                                    <ThumbsDown className="w-4 h-4 mr-1" /> Down
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
