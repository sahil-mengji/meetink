"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type CodeBlockProps = ComponentProps<"pre"> & {
  code: string;
  language?: string;
};

export const CodeBlock = ({ className, code, language, ...props }: CodeBlockProps) => (
  <pre
    className={cn(
      "p-4 overflow-x-auto text-sm font-mono text-muted-foreground",
      className
    )}
    {...props}
  >
    <code className={`language-${language}`}>{code}</code>
  </pre>
);
