"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
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

/* --------------------------- TYPES --------------------------- */

export type FileNode = {
    type: "file";
    name: string;
    path: string;
    content: string;
};

export type FolderNode = {
    type: "folder";
    name: string;
    children: Array<FolderNode | FileNode>;
    isOpen?: boolean;
};

export type Node = FileNode | FolderNode;

/* --------------------------- TREE COMPONENT --------------------------- */

type TreeProps = {
    node: Node;
    onFileClick: (file: FileNode) => void;
    activeFilePath: string | null;
    level?: number;
};

function TreeNode({ node, onFileClick, activeFilePath, level = 0 }: TreeProps) {
    const [isOpen, setIsOpen] = useState(
        node.type === "folder" ? node.isOpen ?? true : false
    );

    const isActive = node.type === "file" && node.path === activeFilePath;

    if (node.type === "file") {
        return (
            <button
                type="button"
                onClick={() => onFileClick(node)}
                className={`cursor-pointer pl-4 truncate ${
                    isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                style={{ paddingLeft: level * 16 }}
            >
                📄 {node.name}
            </button>
        );
    }

    const toggleFolder = () => setIsOpen((v) => !v);

    return (
        <div>
            <button
                type="button"
                onClick={toggleFolder}
                className="flex items-center pl-4 w-full text-left hover:bg-gray-200 dark:hover:bg-gray-700"
                style={{ paddingLeft: level * 16 }}
            >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="ml-1 font-medium">📁 {node.name}</span>
            </button>

            {isOpen &&
                node.children.map((child) => (
                    <TreeNode
                        key={child.type === "file" ? child.path : child.name}
                        node={child}
                        onFileClick={onFileClick}
                        activeFilePath={activeFilePath}
                        level={level + 1}
                    />
                ))}
        </div>
    );
}

/* --------------------------- TREE BUILDER --------------------------- */

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
                    content: contents[fullPath] || "",
                });
            } else {
                let folder = current.find(
                    (c) => c.type === "folder" && c.name === part
                ) as FolderNode;

                if (!folder) {
                    folder = {
                        type: "folder",
                        name: part,
                        children: [],
                        isOpen: true,
                    };
                    current.push(folder);
                }

                current = folder.children;
            }
        }
    }

    return rootChildren;
}

/* --------------------------- FLATTEN HELPER --------------------------- */

function flatten(node: Node): FileNode[] {
    if (node.type === "file") return [node];
    return node.children.flatMap(flatten);
}

/* --------------------------- MAIN COMPONENT --------------------------- */

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
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

    const filesForHook = Object.keys(files).map((path) => ({
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
        handleSave,
        filesContent,
    } = useProblemEditor(filesForHook, {
        filesContent: initialFilesContent,
        title: initialTitle,
        description: initialDescription,
        difficulty: initialDifficulty,
        problemId,
    });

    const filePaths = Object.keys(files);
    const treeNodes = buildTreeFromPaths(
        filePaths,
        filesContent as Record<string, string>
    );

    const handleFileClick = (file: FileNode) => setActiveFilePath(file.path);

    const activeFile = activeFilePath
        ? {
            ...treeNodes.flatMap(flatten).find((f) => f.path === activeFilePath)!,
            content: (filesContent as Record<string, string>)[activeFilePath] ?? ""
        }
        : null;


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
                                        <span className="text-chart-2 font-semibold">
                                            Easy
                                        </span>
                                    )}
                                    {difficulty === "2" && (
                                        <span className="text-chart-3 font-semibold">
                                            Medium
                                        </span>
                                    )}
                                    {difficulty === "3" && (
                                        <span className="text-primary font-semibold">
                                            Hard
                                        </span>
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
                                />
                            ))}
                        </div>

                        <div className="flex-1 flex flex-col min-w-0">
                            <Editor
                                file={activeFile}
                                setEditorContent={(text) => {
                                    if (activeFile) {
                                        handleEditorContentChange(text, activeFile.path);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* RIGHT SIDE */}
                <ResizablePanel minSize={20} className="overflow-auto">
                    <CreateExerciseHeader
                        onSubmit={handleSubmit}
                        disabled={false}
                    />
                    <MarkdownPreview
                        content={(filesContent as Record<string, string>)["/problem.md"] ?? ""}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}