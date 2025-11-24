"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, File } from "lucide-react";
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