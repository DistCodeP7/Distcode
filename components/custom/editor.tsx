"use client";

import Editor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import type React from "react";
import { labToHex } from "@/utils/labToHex";

type CustomEditorProps = EditorProps & {
  editorContent: string;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
};

const handleEditorDidMount: OnMount = (_, monaco) => {
  const styles = getComputedStyle(document.body);
  const rawColor = styles.getPropertyValue("background-color");
  let backgroundColor = "#FFFFFF";

  try {
    const labMatch = rawColor.match(/lab\(([\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)/);
    if (labMatch) {
      const l = parseFloat(labMatch[1]);
      const a = parseFloat(labMatch[2]);
      const b = parseFloat(labMatch[3]);
      backgroundColor = labToHex(l, a, b);
    }
  } catch (error) {
    throw new Error(`Failed to parse and convert LAB color: ${error}`);
  }

  monaco.editor.defineTheme("shadcn-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: { "editor.background": backgroundColor },
  });

  monaco.editor.setTheme("shadcn-theme");
};

export default function CustomEditor({
  language,
  editorContent,
  setEditorContent,
  ...props
}: CustomEditorProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <div className="h-full overflow-hidden rounded-md border">
          <Editor
            height="100%"
            language={language}
            value={editorContent}
            onChange={(value) => value && setEditorContent(value)}
            options={{ minimap: { enabled: false } }}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            {...props}
          />
        </div>
      </div>
    </div>
  );
}

type EditorHeaderProps = {
  actions: React.ReactNode;
};

export function EditorHeader({ actions }: EditorHeaderProps) {
  return (
    <div className="border-b bg-background flex flex-col">
      <div className="flex items-center justify-end px-2 py-1">
        {/* Render the actions passed from the parent */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2 relative z-10">
          {actions}
        </div>
      </div>
    </div>
  );
}
