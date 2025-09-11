"use client";

import Editor from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function IDE() {
  const onSubmit = (code: string) => {
    console.log("Submitted code:", code);
  };
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel minSize={20} className="overflow-y-auto">
        <MarkdownPreview />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={20}>
        <Editor onSubmit={onSubmit} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
