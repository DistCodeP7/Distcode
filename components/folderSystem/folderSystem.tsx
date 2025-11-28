import { FileTypeIcon } from "../custom/Icon";
import type { FileDef } from "../custom/problemEditorClient";
import { Button } from "../ui/button";
import { PlusIcon, TrashIcon } from "lucide-react";

interface FileTreeNode {
  name: string;
  fullPath: string;
  type: "file" | "folder";
  children?: Record<string, FileTreeNode>;
  fileIndex?: number;
}

// Helper to sort tree nodes consistently
const sortNodes = (a: FileTreeNode, b: FileTreeNode) => {
  if (a.type === "folder" && b.type === "file") return 1;
  if (a.type === "file" && b.type === "folder") return -1;
  return a.name.localeCompare(b.name);
};

function buildFileTree(files: FileDef[]): FileTreeNode {
  const root: FileTreeNode = {
    name: "",
    fullPath: "",
    type: "folder",
    children: {},
  };

  files.forEach((file, index) => {
    const parts = file.name.split("/");
    let current = root;
    const currentPathParts: string[] = [];

    parts.forEach((part, partIndex) => {
      currentPathParts.push(part);
      const partFullPath = currentPathParts.join("/");

      current.children = current.children || {}; // Ensure children object exists

      if (!current.children[part]) {
        const isFile = partIndex === parts.length - 1;
        current.children[part] = {
          name: part,
          fullPath: partFullPath,
          type: isFile ? "file" : "folder",
          ...(isFile ? { fileIndex: index } : { children: {} }),
        };
      }
      current = current.children[part];
    });
  });
  return root;
}

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  activeFileIndex?: number;
  onFileChange: (index: number) => void;
  onDeleteFile?: (index: number) => void;
}

function FileTreeItem({
  node,
  depth,
  activeFileIndex,
  onFileChange,
  onDeleteFile,
}: FileTreeItemProps) {
  const paddingLeft = depth * 12;
  const isFile = node.type === "file";

  return isFile ? (
    <div className="flex items-center group">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          node.fileIndex !== undefined && onFileChange(node.fileIndex)
        }
        className={`w-full justify-start text-left gap-2 text-sm h-8 rounded-none ${
          node.fileIndex === activeFileIndex
            ? "bg-accent text-accent-foreground"
            : ""
        }`}
        style={{ paddingLeft: `${paddingLeft + 4}px` }}
      >
        <FileTypeIcon name={node.name.endsWith(".go") ? "go" : "markdown"} />
        <span className="truncate flex-1">{node.name}</span>
      </Button>
      {onDeleteFile && node.fileIndex !== undefined && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            node.fileIndex !== undefined && onDeleteFile(node.fileIndex)
          }
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
          title={`Delete ${node.name}`}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  ) : (
    <div className="w-full">
      <div className="flex flex-col">
        {depth > 0 && (
          <div
            className="flex items-center h-8 font-semibold text-sm"
            style={{ paddingLeft: "4px" }}
          >
            📂 {node.name}/
          </div>
        )}
        {node.children &&
          Object.values(node.children)
            .sort(sortNodes)
            .map((childNode) => (
              <FileTreeItem
                key={childNode.fullPath}
                node={childNode}
                depth={depth + 1}
                activeFileIndex={activeFileIndex}
                onFileChange={onFileChange}
                onDeleteFile={onDeleteFile}
              />
            ))}
      </div>
    </div>
  );
}

interface FolderSystemProps {
  files: FileDef[];
  onFileChange: (index: number) => void;
  onCreateFile?: () => void;
  onDeleteFile?: (index: number) => void;
  activeFileIndex?: number;
}

export function FolderSystem({
  files,
  onFileChange,
  onCreateFile,
  onDeleteFile,
  activeFileIndex,
}: FolderSystemProps) {
  const fileTree = buildFileTree(files);
  const rootChildren = fileTree.children
    ? Object.values(fileTree.children).sort(sortNodes)
    : [];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-2 p-2 border-b">
        {onCreateFile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateFile}
            title="Create New File/Folder"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {rootChildren.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm pt-4">
            No files found.
          </p>
        ) : (
          rootChildren.map((node) => (
            <FileTreeItem
              key={node.fullPath}
              node={node}
              depth={0}
              activeFileIndex={activeFileIndex}
              onFileChange={onFileChange}
              onDeleteFile={onDeleteFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
