import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { temp } from "@/lib/temp";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
const MarkdownPreview = () => {
  const components: Components = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-3xl font-bold mb-4" {...props}>
        {props.children}
      </h1>
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-2xl font-semibold mt-6 mb-3" {...props}>
        {props.children}
      </h2>
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-xl font-semibold mt-5 mb-2" {...props}>
        {props.children}
      </h3>
    ),
    h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className="text-lg font-semibold mt-4 mb-2" {...props}>
        {props.children}
      </h4>
    ),
    h5: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h5 className="text-base font-semibold mt-3 mb-1" {...props}>
        {props.children}
      </h5>
    ),
    h6: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h6 className="text-sm font-semibold mt-2 mb-1" {...props}>
        {props.children}
      </h6>
    ),
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="leading-7 [&:not(:first-child)]:mt-4" {...props}>
        {props.children}
      </p>
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc list-inside my-2 pl-4" {...props}>
        {props.children}
      </ul>
    ),
    ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal list-inside my-2 pl-4" {...props}>
        {props.children}
      </ol>
    ),
    li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
      <li className="mt-1" {...props}>
        {props.children}
      </li>
    ),
    td: ({
      children,
      ...props
    }: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
      <td className="border px-4 py-2" {...props}>
        {children}
      </td>
    ),
    th: ({
      children,
      ...props
    }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
      <th className="border bg-accent px-4 py-2 text-left" {...props}>
        {children}
      </th>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className="odd:bg-muted" {...props}>
        {children}
      </tr>
    ),
    hr: () => <Separator className="my-4" />,

    blockquote: ({
      children,
      ...props
    }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="py-8 border-l-2 pl-6 italic text-muted-foreground"
        {...props}
      >
        {children}
      </blockquote>
    ),
    code: ({
      node,
      inline,
      className,
      children,
      ...props
    }: React.ComponentProps<"code"> & { inline?: boolean; node?: any }) => {
      if (inline) {
        return (
          <code
            className={cn(
              "rounded bg-muted px-1 py-0.5 font-mono text-sm",
              className,
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
    <ScrollArea className="h-full rounded-md border p-8">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {temp}
      </ReactMarkdown>
    </ScrollArea>
  );
};

export default MarkdownPreview;
