"use client";

import { Button } from "@/components/ui/button";
import Editor, { OnMount, type EditorProps } from "@monaco-editor/react";
import { Database, FileCode2, Play, File, Save, Send } from "lucide-react";
import React, { useState } from "react";
import { FileTypeIcon } from "./Icon";
import { cn } from "@/lib/utils";

type CustomEditorProps = EditorProps & {
  onSubmit?: (code: string) => void;
  canSubmit?: boolean;
  initialEditorContent?: string;
  editorContent: string;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
};

function labToHex(l: number, a: number, b: number): string {
  // Step 1: Convert LAB to XYZ
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;
  const labToXyz = (t: number) => {
    const delta = 6 / 29;
    if (t > delta) {
      return t * t * t;
    }
    return 3 * delta * delta * (t - 4 / 29);
  };
  x = labToXyz(x) * 0.95047; // D65 reference X
  y = labToXyz(y) * 1.0; // D65 reference Y
  z = labToXyz(z) * 1.08883; // D65 reference Z
  // Step 2: Convert XYZ to Linear sRGB
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bVal = x * 0.0557 + y * -0.204 + z * 1.057;
  // Step 3: Convert Linear sRGB to gamma-corrected sRGB
  const linearToSrgb = (c: number) => {
    if (c > 0.0031308) {
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }
    return 12.92 * c;
  };
  r = linearToSrgb(r);
  g = linearToSrgb(g);
  bVal = linearToSrgb(bVal);
  // Step 4: Convert sRGB (0-1) to sRGB (0-255) and then to HEX
  const toHexComponent = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  const hexR = toHexComponent(r);
  const hexG = toHexComponent(g);
  const hexB = toHexComponent(bVal);
  return `#${hexR}${hexG}${hexB}`;
}

export default function CustomEditor({
  onSubmit,
  canSubmit = true,
  language = "go",
  initialEditorContent,
  editorContent,
  setEditorContent,
  ...props
}: CustomEditorProps) {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    const styles = getComputedStyle(document.body);
    const rawColor = styles.getPropertyValue("background-color"); // "lab(2.51...)"
    let backgroundColor = "#09090b"; // Default fallback

    try {
      // Safely parse the lab(...) string
      const labMatch = rawColor.match(
        /lab\(([\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)/
      );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(editorContent);
    }
  };

  const onChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <div className="flex-grow">
        <label htmlFor="code-editor" className="sr-only">
          Add your code
        </label>
        <div className="h-full overflow-hidden rounded-md border">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            defaultValue="// Start coding here..."
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
    </form>
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
};

export function EditorHeader({
  files,
  activeFile,
  onFileChange,
}: EditorHeaderProps) {
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
        <Button type="button" variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Submit
        </Button>
      </div>
    </div>
  );
}
