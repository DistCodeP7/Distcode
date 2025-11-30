import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import FileAlertDialog from "./fileAlertDialog";
import { FileTypeIcon } from "./Icon";
import type { FileDef } from "./problemEditorClient";

interface FileTreeNode {
  name: string;
  fullPath: string;
  type: "file" | "folder";
  children?: Record<string, FileTreeNode>;
  fileIndex?: number;
}

// Helper to sort tree nodes consistently
const sortNodes = (a: FileTreeNode, b: FileTreeNode) => {
  // Folders before files
  if (a.type === "folder" && b.type === "file") return -1;
  if (a.type === "file" && b.type === "folder") return 1;
  // Alphabetical sort
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

      current.children = current.children || {};

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
  onCreateFile?: (filename: string, parentPath: string) => void;
}

function FileTreeItem({
  node,
  depth,
  activeFileIndex,
  onFileChange,
  onDeleteFile,
  onCreateFile,
}: FileTreeItemProps) {
  const paddingLeft = depth * 8;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Do not render the root folder's own display, only its children
  if (node.name === "" && node.type === "folder") {
    return (
      <>
        {node.children &&
          Object.values(node.children)
            .sort(sortNodes)
            .map((childNode) => (
              <FileTreeItem
                key={childNode.fullPath}
                node={childNode}
                depth={depth} // Start depth from 0 for top-level items
                activeFileIndex={activeFileIndex}
                onFileChange={onFileChange}
                onDeleteFile={onDeleteFile}
                onCreateFile={onCreateFile}
              />
            ))}
      </>
    );
  }

  const isFile = node.type === "file";

  return (
    <div className="w-full">
      <div className="flex items-center group w-full min-w-0">
        {isFile ? (
          <>
            <div className="flex-1 min-w-0">
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
                style={{ paddingLeft: `${paddingLeft}px` }}
              >
                <FileTypeIcon
                  name={node.name.endsWith(".go") ? "go" : "markdown"}
                />
                <span className="truncate flex-1">{node.name}</span>
              </Button>
            </div>
            {onDeleteFile && node.fileIndex !== undefined && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="h-8 w-8 text-destructive flex-shrink-0"
                  title={`Delete ${node.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
                <FileAlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                  onDelete={() => {
                    if (node.fileIndex !== undefined) {
                      onDeleteFile(node.fileIndex);
                      setDeleteDialogOpen(false);
                      // Visual clean-up, actual state managed by parent
                      node.fileIndex = undefined;
                    }
                  }}
                  defaultName={node.name}
                />
              </>
            )}
          </>
        ) : (
          // Folder display
          <div
            className="flex items-center h-8 font-semibold text-sm w-full"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            <span className="flex items-center">
              📂 {node.name}/
              {onCreateFile && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCreateDialogOpen(true)}
                    title="Create New File/Folder"
                    className="ml-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                  <FileAlertDialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    onCreate={(filename) =>
                      onCreateFile(filename, node.fullPath)
                    }
                  />
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Render children for folders (including the root) */}
      {!isFile && node.children && (
        <div className="flex flex-col">
          {Object.values(node.children)
            .sort(sortNodes)
            .map((childNode) => (
              <FileTreeItem
                key={childNode.fullPath}
                node={childNode}
                depth={depth + 1}
                activeFileIndex={activeFileIndex}
                onFileChange={onFileChange}
                onDeleteFile={onDeleteFile}
                onCreateFile={onCreateFile}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface FolderSystemProps {
  files: FileDef[];
  onFileChange: (index: number) => void;
  onCreateFile?: (filename: string, parentPath: string) => void;
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

  // The root node itself is not rendered, only its children are directly
  const rootChildren = fileTree.children
    ? Object.values(fileTree.children).sort(sortNodes)
    : [];

  return (
    <div className="flex flex-col h-full w-full max-w-[50vw] min-w-[300px]">
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
              depth={0} // Initial depth for top-level files/folders
              activeFileIndex={activeFileIndex}
              onFileChange={onFileChange}
              onDeleteFile={onDeleteFile}
              onCreateFile={onCreateFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
