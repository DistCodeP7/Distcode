import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FolderNode, Node, FileNode } from "./folderStructure";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export function buildFileTree(files: { path: string; content: string }[]): FolderNode {
    const root: FolderNode = { name: "root", type: "folder", children: [], isOpen: true };

    for (const file of files) {
        const parts = file.path.split("/");

        let current: FolderNode = root;

        for (let i = 1; i < parts.length; i++) {
            const isLast = i === parts.length - 1;
            const part = parts[i];

            if (isLast && part.includes(".")) {
                current.children.push({
                    type: "file",
                    name: part,
                    path: file.path,
                    content: file.content,
                });
            } else {
                let folder = current.children.find(
                    (c) => c.type === "folder" && c.name === part
                ) as FolderNode | undefined;

                if (!folder) {
                    folder = { type: "folder", name: part, children: [], isOpen: false };
                    current.children.push(folder);
                }

                current = folder;
            }
        }
    }

    return root;
}

