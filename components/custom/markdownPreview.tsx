import type React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scrollArea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type MarkdownPreviewProps = {
  content?: string;
};

type CodeComponentProps = React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
};

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  const components: Components = {
    h1: (props) => <h1 className="text-3xl font-bold mb-4" {...props} />,
    h2: (props) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />
    ),
    h3: (props) => (
      <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />
    ),
    h4: (props) => (
      <h4 className="text-lg font-semibold mt-4 mb-2" {...props} />
    ),
    h5: (props) => (
      <h5 className="text-base font-semibold mt-3 mb-1" {...props} />
    ),
    h6: (props) => (
      <h6 className="text-sm font-semibold mt-2 mb-1" {...props} />
    ),
    p: (props) => (
      <p className="leading-7 [&:not(:first-child)]:mt-4" {...props} />
    ),
    ul: (props) => (
      <ul className="list-disc list-inside my-2 pl-4" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal list-inside my-2 pl-4" {...props} />
    ),
    li: (props) => <li className="mt-1" {...props} />,
    td: (props) => <td className="border px-4 py-2" {...props} />,
    th: (props) => (
      <th className="border bg-accent px-4 py-2 text-left" {...props} />
    ),
    tr: (props) => <tr className="odd:bg-muted" {...props} />,
    hr: () => <Separator className="my-4" />,
    blockquote: (props) => (
      <blockquote
        className="py-8 border-l-2 pl-6 italic text-muted-foreground"
        {...props}
      />
    ),
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");

      return (
        <Button asChild variant="destructive" size="default">
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
    code: ({ inline, className, children, ...props }: CodeComponentProps) => {
      if (inline) {
        return (
          <code
            className={cn(
              "rounded bg-muted px-1 py-0.5 font-mono text-sm",
              className
            )}
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <div className="grid grid-cols-1 min-w-0 max-w-full rounded-lg overflow-hidden my-4">
          <SyntaxHighlighter
            language={"go"}
            style={vscDarkPlus}
            wrapLongLines
            customStyle={{ margin: 0, width: "100%", maxWidth: "100%" }}
            codeTagProps={{
              style: {},
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
    <ScrollArea className="h-full w-full rounded-md border p-8">
      <div className="prose dark:prose-invert max-w-none w-full min-w-0 break-words">
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
