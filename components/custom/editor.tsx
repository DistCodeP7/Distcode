"use client";

import { Button } from "@/components/ui/button";
import Editor, { OnMount, type EditorProps } from "@monaco-editor/react";
import { Save, Send } from "lucide-react";
import React, { useState } from "react";
import { FileTypeIcon } from "./Icon";
import { cn } from "@/lib/utils";
import { labToHex } from "../../utils/labToHex";

type CustomEditorProps = EditorProps & {
  initialEditorContent?: string;
  editorContent: string;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
};

const handleEditorDidMount: OnMount = (_, monaco) => {
  const styles = getComputedStyle(document.body);
  const rawColor = styles.getPropertyValue("background-color");
  let backgroundColor = "#FFFFFF"; // Default fallback

  try {
    // Safely parse the lab(...) string
    const labMatch = rawColor.match(/lab\(([\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)/);
    if (labMatch) {
      const l = parseFloat(labMatch[1]);
      const a = parseFloat(labMatch[2]);
      const b = parseFloat(labMatch[3]);
      backgroundColor = labToHex(l, a, b);
    }
  } catch (error) {
    console.error("Failed to parse and convert LAB color:", error);
  }

  monaco.editor.defineTheme("shadcn-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": backgroundColor,
    },
  });

  monaco.editor.setTheme("shadcn-theme");
};

export default function CustomEditor({
  language,
  initialEditorContent,
  editorContent,
  setEditorContent,
  ...props
}: CustomEditorProps) {
  const onChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
    }
  };

  const defaultCode = `package main

import "fmt"

func main() {
    fib1 := 0
    fib2 := 1

    for i := 0; i < 10; i++ {
        fib1, fib2 = fib2, fib1 + fib2
        fmt.Println(fib2)
    }
}`;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-grow">
        <label htmlFor="code-editor" className="sr-only">
          Add your code
        </label>
        <div className="h-full overflow-hidden rounded-md border">
          <Editor
            height="100%"
            defaultLanguage="go"
            language={language}
            defaultValue={defaultCode}
            onChange={onChange}
            value={editorContent}
            options={{
              minimap: { enabled: false },
            }}
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
  fileType: "go" | "erlang" | "akka";
};

type EditorHeaderProps = {
  files: Files[];
  activeFile: number;
  onFileChange: (index: number) => void;
  onSubmit: () => Promise<void>;
};

export function EditorHeader({
  files,
  activeFile,
  onFileChange,
  onSubmit,
}: EditorHeaderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <div className="flex items-center justify-between border-b">
      <div className="flex">
        {files.map((file, index) => (
          <div
            key={file.name}
            onClick={() => onFileChange(index)}
            className={cn(
              "cursor-pointer border px-4 py-2 flex items-center gap-2",
              index === activeFile ? "bg-secondary" : "hover:bg-muted"
            )}
          >
            <FileTypeIcon className="h-6 w-6 mr-2" name={file.fileType} />
            {file.name.replace(/\.[^/.]+$/, "")}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pr-4">
        <Button type="button" variant="secondary">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
        <Button
          onClick={async () => {
            setIsSubmitting(true);
            await onSubmit();
            setIsSubmitting(false);
          }}
          type="button"
          variant={isSubmitting ? "disabled" : "default"}
          disabled={isSubmitting}
        >
          <Send className="mr-2 h-4 w-4" />
          Submit
        </Button>
      </div>
    </div>
  );
}
