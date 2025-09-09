"use client";

import Editor from "@/components/custom/editor";

export default function IDE() {
  const onSubmit = (code: string) => {
    console.log("Submitted code:", code);
  };
  return <Editor onSubmit={onSubmit} />;
}
