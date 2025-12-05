declare module "react-syntax-highlighter" {
  import type * as React from "react";
  export const Prism: React.ComponentType<anyProps>;
  export const SyntaxHighlighter: React.ComponentType<AnyProps>;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const vscDarkPlus: unknown;
  export const prism: unknown;
}
