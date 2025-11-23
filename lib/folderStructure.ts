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
    isOpen?: boolean; // for collapsible state
};

export type Node = FileNode | FolderNode;
