"use client";

import Editor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import { Save, Send, X, RotateCcw } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { labToHex } from "@/utils/labToHex";
import { useRouter } from "next/navigation";
import type { FileNode } from "./problemEditorClient";

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
    file: FileNode | null;
    setEditorContent: (content: string | ((prev: string) => string), filePath: string) => void;
};

export default function CustomEditor({
                                         language,
                                         file,
                                         setEditorContent,
                                         ...props
                                     }: CustomEditorProps) {
    const content = file?.content ?? "";
    const lang = language || deriveLanguageFromFileName(file?.name);

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1">
                <div className="h-full overflow-hidden rounded-md border">
                    <Editor
                        height="100%"
                        language={lang}
                        value={content}
                        onChange={(value) => value !== undefined && file && setEditorContent(value, file.path)}
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

function deriveLanguageFromFileName(name?: string): string {
    if (!name) return "plaintext";
    if (name.endsWith(".go")) return "go";
    if (name.endsWith(".md")) return "markdown";
    if (name.endsWith(".ts")) return "typescript";
    if (name.endsWith(".js")) return "javascript";
    return "plaintext";
}

/* ---------------- HEADERS ---------------- */

type EditorHeaderProps = {
    onSubmit: () => void;
    onSave: () => void;
    onReset: () => void;
    disabled?: boolean;
};

export function EditorHeader({
                                 onSubmit,
                                 onSave,
                                 onReset,
                                 disabled = false,
                             }: EditorHeaderProps) {

    return (
        <div className="border-b bg-background flex items-center justify-between px-2 py-1">
            <div className="flex gap-2">
                <Button

                    type="button"
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
                    disabled={disabled}
                >
                    <Send className="w-4 h-4" />
                    Submit
                </Button>
                <Button
                    onClick={onSave}
                    type="button"
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1 text-base hover:cursor-pointer"
                    disabled={disabled}
                >
                    <Save className="w-4 h-4" />
                    Save
                </Button>
                <Button
                    onClick={onReset}
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
    onSubmit: () => void;
    disabled?: boolean;

};

export function CreateExerciseHeader({
                                         onSubmit,
                                         disabled = false,
                                     }: CreateExerciseHeaderProps) {
    const router = useRouter();
    const handleCancel = () => router.push("/authorized/createExercise");

    return (
        <div className="border-b bg-background flex items-center justify-end px-2 py-1 gap-2">
            <Button
                onClick={handleCancel}
                type="button"
                variant="outline"
                className="flex items-center gap-1 px-2 py-1 text-base"
            >
                <X className="w-4 h-4" />
                Cancel
            </Button>

            <Button
                onClick={onSubmit}
                type="button"
                variant="outline"
                className="flex items-center gap-1 px-2 py-1 text-base"
                disabled={disabled}
            >
                <Send className="w-4 h-4" />
                Submit
            </Button>
        </div>
    );
}
