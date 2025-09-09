

import { languages } from "monaco-editor";

// Basic language configuration
export const erlangConfig: languages.LanguageConfiguration = {
  comments: {
    lineComment: "%",
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
    ["<<", ">>"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "<<", close: ">>" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

// Monarch language definition for syntax highlighting
export const erlangMonarch: languages.IMonarchLanguage = {
  defaultToken: "source",
  tokenPostfix: ".erl",

  keywords: [
    "after", "and", "andalso", "band", "begin", "bnot", "bor", "bsl",
    "bsr", "bxor", "case", "catch", "cond", "div", "end", "fun", "if",
    "let", "of", "or", "orelse", "receive", "rem", "try", "when", "xor",
  ],

  atoms: [
    "true", "false", "ok", "error", "undefined",
  ],

  tokenizer: {
    root: [
      // Comments
      { include: "@comments" },
      
      // Atoms and keywords
      [/[a-z][a-zA-Z0-9_]*/, {
        cases: {
          "@keywords": "keyword",
          "@atoms": "constant.language",
          "@default": "identifier"
        }
      }],
      
      // Variables
      [/[A-Z_][a-zA-Z0-9_]*/, "variable"],

      // Strings
      [/"/, { token: "string.quote", next: "@string" }],
      
      // Numbers
      { include: "@numbers" },

      // Delimiters and operators
      [/[{}()\[\]]/, "@brackets"],
      [/[:,.]/, "delimiter"],
    ],

    comments: [
      [/^%%.*$/, "comment.doc"],
      [/%.*$/, "comment"],
    ],
    
    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape"],
      [/"/, { token: "string.quote", next: "@pop" }],
    ],

    numbers: [
      [/\d+#[0-9a-fA-F]+/, "number.hex"],
      [/\d+(\.\d+)?(e[+\-]?\d+)?/, "number"],
    ],
  },
};