"use client";

import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import useCodeEditor from "@/hooks/useCodeEditor";
import { useState } from "react";

export default function IDE() {
  const [file, setFile] = useState(0);
  const { editorContent, setEditorContent, submit } = useCodeEditor();
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full border md:min-w-[450px]"
    >
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <MarkdownPreview />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        <EditorHeader
          files={[
            { name: "file1.go", fileType: "go" },
            { name: "file2.erl", fileType: "erlang" },
            { name: "file2.akka", fileType: "akka" },
          ]}
          activeFile={file}
          onFileChange={(index) => setFile(index)}
          onSubmit={submit}
        />
        <Editor
          editorContent={editorContent}
          setEditorContent={setEditorContent}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
