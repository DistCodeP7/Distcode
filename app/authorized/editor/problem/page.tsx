"use client";

import React, { useState } from "react";
import Editor, { EditorHeader } from "@/components/custom/editor";
import MarkdownPreview from "@/components/custom/markdown-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useProblemEditor } from "@/hooks/useProblemEditor";

const files = [
  { name: "Problem.md", fileType: "markdown" as const },
  { name: "Template.go", fileType: "go" as const },
  { name: "Solution.go", fileType: "go" as const },
  { name: "TestCases.go", fileType: "go" as const },
] as const;

export default function ProblemEditorPage() {
  const {
    title,
    description,
    difficulty,
    activeFile,
    setTitle,
    setDescription,
    setDifficulty,
    setActiveFile,
    handleEditorContentChange,
    handleSubmit,
    filesContent,
  } = useProblemEditor(files);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background flex flex-col gap-2">
        <div className="flex flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Problem title example: Leader Election"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-3xl font-bold bg-transparent outline-none border-none disabled:opacity-50 min-w-0"
            style={{ minHeight: "2.75rem" }}
          />
          <div className="relative w-48 min-w-[10rem]">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 border rounded bg-background text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setShowDropdown((v: boolean) => !v)}
            >
              {difficulty === "1" && (
                <span className="font-semibold text-chart-2">Easy</span>
              )}
              {difficulty === "2" && (
                <span className="font-semibold text-chart-3">Medium</span>
              )}
              {difficulty === "3" && (
                <span className="font-semibold text-primary">Hard</span>
              )}
              {(!difficulty || !["1", "2", "3"].includes(difficulty)) && (
                <span className="text-muted-foreground">Select difficulty</span>
              )}
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded shadow-lg">
                <ul className="py-1">
                  <li>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent"
                      onClick={() => {
                        setDifficulty("1");
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-semibold text-chart-2">Easy</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent"
                      onClick={() => {
                        setDifficulty("2");
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-semibold text-chart-3">Medium</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent"
                      onClick={() => {
                        setDifficulty("3");
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-semibold text-primary">Hard</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          placeholder="Short description of the problem..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 border md:min-w-[450px]"
      >
        <ResizablePanel minSize={20} className="overflow-y-auto">
          <MarkdownPreview content={filesContent[0]} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel minSize={20} className="flex flex-col">
          <EditorHeader
            files={[...files]}
            activeFile={activeFile}
            onFileChange={setActiveFile}
            onSubmit={handleSubmit}
          />
          <Editor
            editorContent={filesContent[activeFile]}
            setEditorContent={handleEditorContentChange}
            language={activeFile === 0 ? "markdown" : "go"}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
