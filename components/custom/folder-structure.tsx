"use client";

import { useState } from "react";
import { FolderNode, FileNode, Node } from "@/lib/folderStructure";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

type TreeProps = {
    node: Node;
    onFileClick: (file: FileNode) => void;
    level?: number;
};

export function TreeNode({ node, onFileClick, level = 0 }: TreeProps) {
    const [isOpen, setIsOpen] = useState(node.type === "folder" ? node.isOpen ?? false : false);

    if (node.type === "file") {
        return (
            <div
                className="cursor-pointer pl-4 hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ paddingLeft: level * 16 }}
                onClick={() => onFileClick(node)}
            >
                📄 {node.name}
            </div>
        );
    }

    return (
        <div>
            <div
                className="flex items-center cursor-pointer pl-4 hover:bg-gray-200 dark:hover:bg-gray-700"
                style={{ paddingLeft: level * 16 }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="ml-1 font-medium">📁 {node.name}</span>
            </div>

            {isOpen &&
                node.children.map((child) => (
                    <TreeNode key={child.name + child.type} node={child} onFileClick={onFileClick} level={level + 1} />
                ))}
        </div>
    );
}
