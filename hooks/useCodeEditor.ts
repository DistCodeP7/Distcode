import { useState } from "react";
import { submitCode } from "@/app/authorized/editor/actions";

const useCodeEditor = () => {
  const [editorContent, setEditorContent] = useState<string>("");

  const submit = async () => {
    await submitCode(editorContent);
  };

  return { editorContent, setEditorContent, submit };
};

export default useCodeEditor;
