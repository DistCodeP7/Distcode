"use client";

import Editor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import { Save, Send } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { labToHex } from "@/utils/labToHex";
import { FileTypeIcon } from "./Icon";

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
    console.error("Failed to parse LAB color:", error);
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

type Files = {
  name: string;
  fileType: "go" | "erlang" | "akka" | "markdown";
};

type EditorHeaderProps = {
  files: Files[];
  activeFile: number;
  onFileChange: (index: number) => void;
  onSubmit: () => void;
  onSave?: () => void;
};

export function EditorHeader({
  files,
  activeFile,
  onFileChange,
  onSubmit,
  onSave,
}: EditorHeaderProps) {
  const visibleFiles = files;

  return (
    <div className="border-b bg-background flex flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        {/* Left side: file tabs */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 pr-20">
          {visibleFiles.map((file, idx) => {
            const trueIndex = idx;
            return (
              <Button
                key={file.name}
                onClick={() => onFileChange(trueIndex)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 flex-shrink-0 transition-colors truncate",
                  trueIndex === activeFile
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <FileTypeIcon className="w-4 h-4" name={file.fileType} />
                <span className="truncate max-w-[12ch]">{file.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Right side: Save / Submit */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2 relative z-10">
          <Button
            type="button"
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-base"
            onClick={onSave}
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            onClick={onSubmit}
            type="button"
            variant="outline"
            className="flex items-center gap-1 px-2 py-1 text-base"
          >
            <Send className="w-4 h-4" />
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
