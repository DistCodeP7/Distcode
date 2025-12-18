import type React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scrollArea";

type MarkdownPreviewProps = {
  content?: string;
  color?: string;
};

type CodeComponentProps = React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

const MarkdownPreview = ({
  content,
  color = "black",
}: MarkdownPreviewProps) => {
  const components: Components = {
    h1: (props) => <h1 className="text-3xl font-bold mb-4" {...props} />,
    h2: (props) => (
      <h2
        className="text-2xl font-semibold mt-6 mb-3 border-b pb-2"
        {...props}
      />
    ),
    h3: (props) => (
      <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />
    ),
    h4: (props) => (
      <h4 className="text-lg font-semibold mt-4 mb-2" {...props} />
    ),
    // FIX 1: Use 'div' instead of 'p' to prevent "p cannot contain div/pre" errors
    p: (props) => (
      <div
        className="leading-7 [&:not(:first-child)]:mt-4 text-foreground"
        {...props}
      />
    ),
    ul: (props) => (
      <ul className="list-disc list-inside my-2 pl-4" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal list-inside my-2 pl-4" {...props} />
    ),
    li: (props) => <li className="mt-1" {...props} />,
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      return (
        <Button
          asChild
          variant="link"
          className="p-0 h-auto font-bold underline text-primary"
          size="default"
        >
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            {...props}
          >
            {children}
          </a>
        </Button>
      );
    },
    // FIX 2: Handle 'pre' to avoid double wrapping code blocks
    pre: ({ children }) => <>{children}</>,
    code: ({ inline, className, children, ...props }: CodeComponentProps) => {
      const match = /language-(\w+)/.exec(className || "");

      if (inline) {
        return (
          <code
            className={cn(
              "rounded bg-muted px-1 py-0.5 font-mono text-sm text-foreground",
              className
            )}
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <div className="relative my-4 rounded-lg overflow-hidden border bg-zinc-950">
          <SyntaxHighlighter
            language={match?.[1] || "go"} // Auto-detect language or default to go
            style={vscDarkPlus}
            PreTag="div" // Tell highlighter to use div, not pre (since we are inside a div already)
            customStyle={{
              margin: 0,
              padding: "1.5rem",
              backgroundColor: "transparent", // Let parent div handle bg
            }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      );
    },
  };

  return (
    <ScrollArea
      className={cn(
        "h-full w-full rounded-md border p-6 md:p-8",
        color ? `bg-[${color}]` : ""
      )}
    >
      {/* Added break-words to prevent code overflow causing horizontal scroll on body */}
      <div className="prose dark:prose-invert max-w-none w-full break-words">
        <ReactMarkdown
          components={components}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSlug]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </ScrollArea>
  );
};

export default MarkdownPreview;
