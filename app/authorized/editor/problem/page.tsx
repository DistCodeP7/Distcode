"use client";

import Editor from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";
import { submitProblem } from "./submitProblem";

export default function ProblemPage() {
  const [file, setFile] = useState(0);
  const [filesContent, setFilesContent] = useState([
    "# Start writing your problem in markdown...",
    "// Start coding your template in Go...",
    "// Start coding your solution in Go...",
    "// Start coding your test cases in Go...",
  ]);
  const [title, setTitle] = useState("");

  const files = [
    { name: "Problem.md", fileType: "markdown" as const },
    { name: "Template.go", fileType: "go" as const },
    { name: "Solution.go", fileType: "go" as const },
    { name: "Test cases.go", fileType: "go" as const },
  ];

  const handleFileChange = (index: number) => setFile(index);
  const handleContentChange: React.Dispatch<React.SetStateAction<string>> = (
    value
  ) => {
    setFilesContent((prev) => {
      const updated = [...prev];
      const newValue = typeof value === "function" ? value(prev[file]) : value;
      updated[file] = newValue;
      return updated;
    });
  };

  const handleSubmit = async () => {
    const result = await submitProblem({
      title,
      markdown: filesContent[0],
      // Optionally add other files here
    });
    if (result.success) {
      alert("Problem submitted successfully!");
    } else {
      alert(result.error || "Failed to submit problem.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background">
        <input
          type="text"
          className="w-full text-2xl font-bold bg-transparent outline-none border-none"
          placeholder="Problem title example: Leader Election"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border md:min-w-[450px]"
      >
        <ResizablePanel minSize={20} className="overflow-y-auto">
          <MarkdownPreview content={filesContent[0]} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={20}>
          <Editor
            files={files}
            activeFile={file}
            onFileChange={handleFileChange}
            editorContent={filesContent[file]}
            setEditorContent={handleContentChange}
            onSubmit={handleSubmit}
            language={files[file].fileType === "go" ? "go" : "markdown"}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
