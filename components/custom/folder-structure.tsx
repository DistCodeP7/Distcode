"use client";

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { NewFileDialog } from "@/components/custom/alert-dialog";
import type { FileNode, FolderNode, Node } from "@/lib/folderStructure";

export interface TreeProps {
  node: Node;
  onFileClick: (file: FileNode) => void;
  activeFilePath: string | null;
  level?: number;
  onAddFile?: (path: string) => void;
  onDeleteFile?: (path: string) => void;
  createdFiles: Set<string>;
}

export interface EditableFileNode extends FileNode {
  readOnly?: boolean;
}

export interface FilteredTreeProps {
  node: Node;
  level?: number;
  onFileClick: (file: EditableFileNode) => void;
  activeFilePath?: string | null;
  onAddFile?: (folderPath: string) => void;
  onDeleteFile?: (filePath: string) => void;
}

function sanitizeFileName(name: string): string {
  return `${name.includes(".") ? name.split(".")[0] : name}.go`;
}

export function flattenTree(node: Node): FileNode[] {
  return node.type === "file" ? [node] : node.children.flatMap(flattenTree);
}

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

export function TreeNode({
  node,
  onFileClick,
  activeFilePath,
  level = 0,
  onAddFile,
  onDeleteFile,
  createdFiles,
}: TreeProps) {
  const [isOpen, setIsOpen] = useState(
    node.type === "folder" ? (node.isOpen ?? true) : false
  );

  const [newFileOpen, setNewFileOpen] = useState(false);

  const padding = { paddingLeft: level * 16 };

  if (node.type === "file") {
    const isActive = node.path === activeFilePath;
    const canDelete =
      onDeleteFile &&
      !node.path.endsWith("main.go") &&
      !node.path.endsWith("protocol.go") &&
      !node.path.endsWith("problem.md") &&
      !node.path.endsWith("solution.md");

    return (
      <div className="flex items-center justify-between w-full" style={padding}>
        <button
          type="button"
          onClick={() => onFileClick(node)}
          className={`cursor-pointer pl-4 py-1 rounded-sm flex-1 text-left flex items-center gap-1 ${
            isActive ? "bg-primary/75 font-semibold" : "hover:bg-muted"
          }`}
        >
          📄 {node.name}
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteFile?.(node.path)}
            className="p-1 hover:bg-gray-600 hover:text-white rounded"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  }

  function addFile(name: string) {
    const sanitized = sanitizeFileName(name);
    const newPath = `${node.name}/${sanitized}`;
    onAddFile?.(newPath);
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={padding}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center py-1 hover:bg-muted rounded-sm flex-1 text-left"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="ml-1 font-medium">📁 {node.name}</span>
        </button>

        {onAddFile && (
          <button
            type="button"
            onClick={() => setNewFileOpen(true)}
            className="p-1 hover:bg-gray-600 hover:text-white rounded hover:cursor-pointer"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <NewFileDialog
        open={newFileOpen}
        onOpenChange={setNewFileOpen}
        title="Create New File"
        description="Enter a name for the new file. Any suffixes will be ignored."
        onCreate={addFile}
      />

      {isOpen &&
        node.children?.map((child) => (
          <TreeNode
            key={child.type === "file" ? child.path : child.name}
            node={child}
            onFileClick={onFileClick}
            activeFilePath={activeFilePath}
            level={level + 1}
            onAddFile={onAddFile}
            onDeleteFile={onDeleteFile}
            createdFiles={createdFiles}
          />
        ))}
    </div>
  );
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
  const [isOpen, setIsOpen] = useState(
    isFolder ? ((node as FolderNode).isOpen ?? true) : false
  );
  const [newFileOpen, setNewFileOpen] = useState(false);

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
            className="p-1 hover:bg-gray-600 hover:text-white rounded"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  }

  function addFile(name: string) {
    const sanitized = sanitizeFileName(name);
    const newPath = `${node.name}/${sanitized}`;
    onAddFile?.(newPath);
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={padding}>
        <button
          type="button"
          onClick={() => setIsOpen((s) => !s)}
          className="flex items-center py-1 hover:bg-muted rounded-sm flex-1 text-left"
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="ml-1 font-medium">📁 {node.name}</span>
        </button>

        {node.name === "template" && onAddFile && (
          <button
            type="button"
            onClick={() => setNewFileOpen(true)}
            className="p-1 hover:bg-gray-600 hover:text-white rounded hover:cursor-pointer"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <NewFileDialog
        open={newFileOpen}
        onOpenChange={setNewFileOpen}
        title="Create New File"
        description="Enter a name for the new file. Any suffixes will be ignored."
        onCreate={addFile}
      />

      {isOpen &&
        node.children?.map((child) => (
          <FilteredTreeNode
            key={child.type === "file" ? child.path : child.name}
            node={child}
            onFileClick={onFileClick}
            activeFilePath={activeFilePath}
            level={level + 1}
            onAddFile={onAddFile}
            onDeleteFile={onDeleteFile}
          />
        ))}
    </div>
  );
}
