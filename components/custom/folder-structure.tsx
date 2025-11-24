"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Trash2, Plus } from "lucide-react";
import type { Node, FileNode, FolderNode } from "./problemEditorClient";

export interface TreeProps {
    node: Node;
    level?: number;
    onFileClick: (file: FileNode) => void;
    activeFilePath?: string | null; // Added for highlighting
}

export function TreeNode({ node, level = 0, onFileClick }: TreeProps) {
    const isFolder = node.type === "folder";

    const [isOpen, setIsOpen] = useState(() => {
        if (isFolder) return (node as FolderNode).isOpen ?? true;
        return false;
    });

    const padding = { paddingLeft: level * 16 };

    if (node.type === "file") {
        const handleActivate = () => onFileClick(node);

        return (
            <button
                type="button"
                onClick={handleActivate}
                className={`cursor-pointer pl-4 py-1 hover:bg-muted rounded-sm flex items-center gap-1 w-full text-left`}
                style={padding}
            >
                📄 {node.name}
            </button>
        );
    }

    const folder = node as FolderNode;

    const toggle = () => setIsOpen((s) => !s);

    return (
        <div>
            <button
                type="button"
                onClick={toggle}
                className="flex items-center py-1 hover:bg-muted rounded-sm w-full text-left"
                style={padding}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="ml-1 font-medium">📁 {folder.name}</span>
            </button>

            {isOpen &&
                folder.children?.map((child) => (
                    <TreeNode
                        key={(child as any).path ?? child.name}
                        node={child}
                        onFileClick={onFileClick}
                        level={level + 1}
                    />
                ))}
        </div>
    );
}


type EditableFileNode = FileNode & {
    readOnly?: boolean;
};

export interface FilteredTreeProps {
    node: Node;
    level?: number;
    onFileClick: (file: EditableFileNode) => void;
    activeFilePath?: string | null;
    onAddFile?: (folderPath: string) => void;
    onDeleteFile?: (filePath: string) => void;
}

export function FilteredTreeNode({
                                     node,
                                     level = 0,
                                     onFileClick,
                                     activeFilePath,
                                     onAddFile,
                                     onDeleteFile,
                                 }: FilteredTreeProps) {
    const isFolder = node.type === "folder";
    const [isOpen, setIsOpen] = useState(() =>
        isFolder ? (node as FolderNode).isOpen ?? true : false
    );
    const padding = { paddingLeft: level * 16 };

    if (node.type === "file") {
        const file = node as EditableFileNode;
        const handleActivate = () => {
            if (!file.readOnly) onFileClick(file);
        };

        const canDelete =
            onDeleteFile &&
            !file.path.endsWith("main.go") &&
            file.path.startsWith("/template");

        const isActive = activeFilePath === file.path;

        return (
            <div className="flex items-center justify-between w-full" style={padding}>
                <button
                    type="button"
                    onClick={handleActivate}
                    className={`cursor-pointer pl-4 py-1 rounded-sm flex-1 text-left flex items-center gap-1
                        ${file.readOnly ? "opacity-70 cursor-not-allowed" : ""}
                        ${isActive ? "bg-primary/75 font-semibold" : "hover:bg-muted"}`}
                >
                    📄 {file.name}
                </button>
                {canDelete && (
                    <button
                        type="button"
                        onClick={() => onDeleteFile?.(file.path)}
                        className="p-1 hover:bg-red-600 hover:text-white rounded"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        );
    }

    const folder = node as FolderNode;
    const toggle = () => setIsOpen((s) => !s);
    const isTemplateFolder = folder.name === "template";

    return (
        <div>
            <div className="flex items-center justify-between" style={padding}>
                <button
                    type="button"
                    onClick={toggle}
                    className="flex items-center py-1 hover:bg-muted rounded-sm flex-1 text-left"
                >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="ml-1 font-medium">📁 {folder.name}</span>
                </button>
                {isTemplateFolder && onAddFile && (
                    <button
                        type="button"
                        onClick={() => {
                            const name = prompt("Enter new file name");
                            if (name) onAddFile(`${folder.name}/${name}`);
                        }}
                        className="p-1 hover:bg-green-600 hover:text-white rounded"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            {isOpen &&
                folder.children?.map((child) => (
                    <FilteredTreeNode
                        key={child.type === "file" ? child.path : child.name}
                        node={child}
                        onFileClick={onFileClick}
                        activeFilePath={activeFilePath} // pass it down
                        level={level + 1}
                        onAddFile={onAddFile}
                        onDeleteFile={onDeleteFile}
                    />
                ))}
        </div>
    );
}
