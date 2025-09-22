"use client";

import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";
import { temp } from "@/lib/temp";

export default function ProblemPage() {
  const [file, setFile] = useState(0);
  const [markdownCode, setMarkdownCode] = useState("# Start writing your problem in markdown...");
  const [exampleCode, setExampleCode] = useState(temp);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full border md:min-w-[450px]"
    >
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <MarkdownPreview content={file === 0 ? markdownCode : exampleCode} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        <EditorHeader
          files={[
            { name: "Problem.md", fileType: "markdown" },
            { name: "Example.md", fileType: "markdown" },
          ]}
          activeFile={file}
          onFileChange={(index) => setFile(index)}
        />
        <Editor
          editorContent={file === 0 ? markdownCode : exampleCode}
          setEditorContent={file === 0 ? setMarkdownCode : setExampleCode}
          onSubmit={(code: string) => {
            console.log("Submitted code:", code);
          }}
          language="markdown"
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
