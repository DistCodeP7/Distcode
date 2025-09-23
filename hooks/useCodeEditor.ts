import { submitCode } from "@/app/authorized/editor/actions";
import { useState } from "react";

const useCodeEditor = () => {
  const [editorContent, setEditorContent] = useState<string>("");

  const submit = async () => {
    await submitCode(editorContent);
  };

  return { editorContent, setEditorContent, submit };
};

export default useCodeEditor;
