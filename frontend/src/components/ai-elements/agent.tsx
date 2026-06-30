"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BotIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { memo } from "react";

import { CodeBlock } from "./code-block";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type AgentProps = ComponentProps<typeof Collapsible>;

export const Agent = memo(({ className, defaultOpen = false, ...props }: AgentProps) => (
  <Collapsible
    defaultOpen={defaultOpen}
    className={cn("w-full", className)}
    {...props}
  />
));

export type AgentHeaderProps = ComponentProps<typeof CollapsibleTrigger> & {
  name: string;
  model?: string;
};

export const AgentHeader = memo(
  ({ className, name, model, children, ...props }: AgentHeaderProps) => (
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between gap-4 p-0 group hover:no-underline",
        className
      )}
      {...props}
    >
      {children ?? (
        <div className="flex items-center gap-2">
          <BotIcon className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm text-foreground">{name}</span>
          {model && (
            <Badge className="font-mono text-xs" variant="secondary">
              {model}
            </Badge>
          )}
        </div>
      )}
    </CollapsibleTrigger>
  )
);

export type AgentContentProps = ComponentProps<typeof CollapsibleContent>;

export const AgentContent = memo(
  ({ className, ...props }: AgentContentProps) => (
    <CollapsibleContent
      className={cn(
        "space-y-4 pt-3 outline-none overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
        className
      )}
      {...props}
    />
  )
);

export type AgentInstructionsProps = ComponentProps<"div"> & {
  children: string;
};

export const AgentInstructions = memo(
  ({ className, children, ...props }: AgentInstructionsProps) => (
    <div className={cn("space-y-2", className)} {...props}>
      <span className="font-medium text-muted-foreground text-sm">
        Instructions
      </span>
      <div className="rounded-md bg-muted/50 p-3 text-muted-foreground text-sm">
        <p>{children}</p>
      </div>
    </div>
  )
);

export type AgentToolsProps = ComponentProps<typeof Accordion> & {
  type?: "single" | "multiple";
};

export const AgentTools = memo(({ className, type = "multiple", ...props }: AgentToolsProps) => (
  <div className={cn("space-y-2", className)}>
    <span className="font-medium text-muted-foreground text-sm">Tools</span>
    {/* @ts-expect-error dynamic type spread issue */}
    <Accordion type={type} className="rounded-md border" {...props} />
  </div>
));

export type AgentToolProps = ComponentProps<typeof AccordionItem> & {
  tool: any;
};

export const AgentTool = memo(
  ({ className, tool, value, ...props }: AgentToolProps) => {
    const schema =
      tool && typeof tool === "object" && "jsonSchema" in tool && tool.jsonSchema
        ? tool.jsonSchema
        : tool?.inputSchema;

    return (
      <AccordionItem
        className={cn("border-b last:border-b-0", className)}
        value={value}
        {...props}
      >
        <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
          {tool?.description ?? "No description"}
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3">
          <div className="rounded-md bg-muted/50">
            <CodeBlock code={JSON.stringify(schema, null, 2)} language="json" />
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }
);

export type AgentOutputProps = ComponentProps<"div"> & {
  schema: string;
};

export const AgentOutput = memo(
  ({ className, schema, ...props }: AgentOutputProps) => (
    <div className={cn("space-y-2", className)} {...props}>
      <span className="font-medium text-muted-foreground text-sm">
        Output Schema
      </span>
      <div className="rounded-md bg-muted/50">
        <CodeBlock code={schema} language="typescript" />
      </div>
    </div>
  )
);

Agent.displayName = "Agent";
AgentHeader.displayName = "AgentHeader";
AgentContent.displayName = "AgentContent";
AgentInstructions.displayName = "AgentInstructions";
AgentTools.displayName = "AgentTools";
AgentTool.displayName = "AgentTool";
AgentOutput.displayName = "AgentOutput";
