"use client";

import Editor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import { RotateCcw, Save, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { FileData } from "@/lib/folderStructure";
import { labToHex } from "@/utils/labToHex";

/* ---------------- MONACO THEME ---------------- */

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

/* ---------------- CUSTOM EDITOR ---------------- */

type CustomEditorProps = EditorProps & {
  file: FileData;
  setEditorContent: (
    content: string | ((prev: string) => string),
    filePath: string
  ) => void;
};

export default function CustomEditor({
  file,
  setEditorContent,
  ...props
}: CustomEditorProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <div className="h-full overflow-hidden rounded-md border">
          <Editor
            height="100%"
            language={file.fileType}
            value={file.content}
            onChange={(value) =>
              value !== undefined && file && setEditorContent(value, file.path)
            }
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
  onSubmitAction: () => void;
  onSaveAction: () => void;
  onResetAction: () => void;
  disabled?: boolean;
};

export function EditorHeader({
  onSubmitAction,
  onSaveAction,
  onResetAction,
  disabled = false,
}: EditorHeaderProps) {
  return (
    <div className="border-b bg-background flex items-center justify-between px-2 py-1">
      <div className="flex gap-2">
        <Button
          onClick={onSubmitAction}
          type="button"
          variant="outline"
          className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
          disabled={disabled}
        >
          <Send className="w-4 h-4" />
          Submit
        </Button>
        <Button
          onClick={onSaveAction}
          type="button"
          variant="outline"
          className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
          disabled={disabled}
        >
          <Save className="w-4 h-4" />
          Save
        </Button>
        <Button
          onClick={onResetAction}
          type="button"
          variant="outline"
          className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
          disabled={disabled}
        >
          <RotateCcw className="w-4 h-4" />
          Reset Code
        </Button>
      </div>
    </div>
  );
}

type CreateExerciseHeaderProps = {
  onSubmitAction: () => void;
  disabled?: boolean;
};

export function CreateExerciseHeader({
  onSubmitAction,
  disabled = false,
}: CreateExerciseHeaderProps) {
  const router = useRouter();
  const handleGoBack = () => router.push("/authorized");

  return (
    <div className="border-b bg-background flex items-center justify-end px-2 py-1 gap-2">
      <Button
        onClick={handleGoBack}
        type="button"
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
      >
        <X className="w-4 h-4" />
        Go Back
      </Button>

      <Button
        onClick={onSubmitAction}
        type="button"
        variant="outline"
        className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
        disabled={disabled}
      >
        <Send className="w-4 h-4" />
        Submit
      </Button>
    </div>
  );
}
