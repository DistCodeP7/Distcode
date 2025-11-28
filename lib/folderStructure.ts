export type FileNode = {
  type: "file";
  name: string;
  path: string;
  content: string;
};

export type FileData = {
  fileType: "go" | "markdown";
  content: string;
  name: string;
  path: string;
};

export type FolderNode = {
  type: "folder";
  name: string;
  children: Array<FolderNode | FileNode>;
  isOpen?: boolean;
};

export type Node = FileNode | FolderNode;
