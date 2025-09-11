import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { temp } from "@/lib/temp";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

const MarkdownPreview = () => {
  const components: Components = {
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-3xl font-bold mb-4">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-xl font-semibold mt-5 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>
    ),
    h5: ({ children }: { children: React.ReactNode }) => (
      <h5 className="text-base font-semibold mt-3 mb-1">{children}</h5>
    ),
    h6: ({ children }: { children: React.ReactNode }) => (
      <h6 className="text-sm font-semibold mt-2 mb-1">{children}</h6>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="leading-7 [&:not(:first-child)]:mt-4">{children}</p>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside my-2 pl-4">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside my-2 pl-4">{children}</ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="mt-1">{children}</li>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="border px-4 py-2">{children}</td>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="border bg-accent px-4 py-2 text-left">{children}</th>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
      <tr className="odd:bg-muted">{children}</tr>
    ),
    hr: () => <Separator className="my-4" />,
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="py-8 border-l-2 pl-6 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({
      inline,
      className,
      children,
      ...props
    }: {
      inline?: boolean;
      className?: string;
      children: React.ReactNode;
    }) => {
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
        <pre className="rounded-lg bg-muted p-4 whitespace-pre-wrap break-words">
          <code className={cn("font-mono", className)} {...props}>
            {children}
          </code>
        </pre>
      );
    },
  };

  return (
    <ScrollArea className="h-full rounded-md border p-4">
      <ReactMarkdown
        className="prose prose-zinc dark:prose-invert max-w-none py-5 px-8"
        components={components}
        remarkPlugins={[remarkGfm]}
      >
        {temp}
      </ReactMarkdown>
    </ScrollArea>
  );
};

export default MarkdownPreview;
