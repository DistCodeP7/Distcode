"use client";

import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";

export default function IDE() {
  const [markdownCode, setMarkdownCode] = useState("");

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full border md:min-w-[450px]"
    >
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <MarkdownPreview content={markdownCode} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        <Editor
          editorContent={markdownCode}
          setEditorContent={setMarkdownCode}
          onSubmit={() => {}}
          language="markdown"
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
