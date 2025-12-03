import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import type { Paths } from "@/drizzle/schema";
import { Button } from "../ui/button";
import FileAlertDialog from "./fileAlertDialog";
import { FileTypeIcon } from "./Icon";

interface FileTreeNode {
  name: string;
  fullPath: string;
  type: "file" | "folder";
  children?: Record<string, FileTreeNode>;
  fileKey?: string;
}

const sortNodes = (a: FileTreeNode, b: FileTreeNode) => {
  if (a.type === "folder" && b.type === "file") return -1;
  if (a.type === "file" && b.type === "folder") return 1;
  return a.name.localeCompare(b.name);
};

function buildFileTree(filePaths: string[]): FileTreeNode {
  const root: FileTreeNode = {
    name: "",
    fullPath: "",
    type: "folder",
    children: {},
  };

  filePaths.forEach((path) => {
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const parts = normalizedPath.split("/").filter(Boolean);
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
          ...(isFile ? { fileKey: path } : { children: {} }),
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
  activeFilePath?: string;
  onFileChange: (path: string) => void;
  onDeleteFile?: (path: string) => void;
  onCreateFile?: (filename: string, parentPath: string) => void;
}

function FileTreeItem({
  node,
  depth,
  activeFilePath,
  onFileChange,
  onDeleteFile,
  onCreateFile,
}: FileTreeItemProps) {
  const paddingLeft = depth * 8;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
                depth={depth}
                activeFilePath={activeFilePath}
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
      <div className="flex items-center group w-full min-w-0 overflow-hidden">
        {isFile ? (
          <div className="relative w-full flex items-center min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                node.fileKey !== undefined && onFileChange(node.fileKey)
              }
              className={`w-full min-w-0 shrink justify-start text-left gap-2 text-sm h-8 rounded-none ${
                node.fileKey === activeFilePath
                  ? "bg-accent text-accent-foreground"
                  : ""
              }`}
              style={{
                paddingLeft: `${paddingLeft}px`,
                paddingRight: "2.5rem",
              }}
            >
              <FileTypeIcon
                name={node.name.endsWith(".go") ? "go" : "markdown"}
              />
              <span className="truncate min-w-0 flex-1">{node.name}</span>
            </Button>

            {onDeleteFile && node.fileKey !== undefined && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-destructive"
                  title={`Delete ${node.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>

                <FileAlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                  onDelete={() => {
                    if (node.fileKey !== undefined) {
                      onDeleteFile(node.fileKey);
                      setDeleteDialogOpen(false);
                    }
                  }}
                  defaultName={node.name}
                />
              </>
            )}
          </div>
        ) : (
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
                    title="Create New File"
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
                    currentPath={`${node.fullPath}/`}
                  />
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {!isFile && node.children && (
        <div className="flex flex-col min-w-0">
          {Object.values(node.children)
            .sort(sortNodes)
            .map((childNode) => (
              <FileTreeItem
                key={childNode.fullPath}
                node={childNode}
                depth={depth + 1}
                activeFilePath={activeFilePath}
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
  files: Paths;
  onFileChange: (path: string) => void;
  onCreateFile?: (filename: string, parentPath: string) => void;
  onDeleteFile?: (path: string) => void;
  activeFilePath?: string;
}

export function FolderSystem({
  files,
  onFileChange,
  onCreateFile,
  onDeleteFile,
  activeFilePath,
}: FolderSystemProps) {
  const fileTree = buildFileTree(Object.keys(files));

  const rootChildren = fileTree.children
    ? Object.values(fileTree.children).sort(sortNodes)
    : [];

  return (
    <div className="flex flex-col h-full w-full max-w-[50vw]">
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
              activeFilePath={activeFilePath}
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
