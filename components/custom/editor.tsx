"use client";

import { Button } from "@/components/ui/button";
import Editor, { type EditorProps } from "@monaco-editor/react";
import React, { useState } from "react";

type CustomEditorProps = EditorProps & {
  onSubmit?: (code: string) => void;
  canSubmit?: boolean;
  initialEditorContent?: string;
};

export default function CustomEditor({
  theme = "vs-dark",
  onSubmit,
  canSubmit = false,
  language,
  initialEditorContent,
  ...props
}: CustomEditorProps) {
  const [editorContent, setEditorContent] = useState<string>(
    initialEditorContent || ""
  );

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
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="code-editor" className="sr-only">
          Add your code
        </label>
        <div className="border rounded-md overflow-hidden">
          <Editor
            height="50vh"
            defaultLanguage="cpp"
            language={language}
            defaultValue="// Start coding here..."
            onChange={onChange}
            value={editorContent}
            options={{
              minimap: { enabled: false },
            }}
            theme={theme}
            {...props}
          />
        </div>
      </div>
      <div className="flex justify-end pt-3">
        <Button
          type="submit"
          variant={canSubmit ? "outline" : "disabled"}
          disabled={!canSubmit}
        >
          Run
        </Button>
      </div>
    </form>
  );
}
