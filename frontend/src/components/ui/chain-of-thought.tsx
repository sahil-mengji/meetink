"use client";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Shimmer } from "@/components/ui/shimmer";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { BrainIcon, ChevronDownIcon, DotIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, memo, useContext, useMemo, useState, useEffect } from "react";

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
  null
);

export const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "ChainOfThought components must be used within ChainOfThought"
    );
  }
  return context;
};

export type ChainOfThoughtProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [isOpenState, setIsOpenState] = useState(open !== undefined ? open : defaultOpen);
    
    useEffect(() => {
      if (open !== undefined) {
        setIsOpenState(open);
      }
    }, [open]);

    const setIsOpen = (val: boolean) => {
      setIsOpenState(val);
      onOpenChange?.(val);
    };

    const isOpen = open !== undefined ? open : isOpenState;

    const chainOfThoughtContext = useMemo(
      () => ({ isOpen, setIsOpen }),
      [isOpen]
    );

    return (
      <ChainOfThoughtContext.Provider value={chainOfThoughtContext}>
        <div className={cn("not-prose w-full space-y-4", className)} {...props}>
          {children}
        </div>
      </ChainOfThoughtContext.Provider>
    );
  }
);

export type ChainOfThoughtHeaderProps = ComponentProps<
  typeof CollapsibleTrigger
>;

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
    const { isOpen, setIsOpen } = useChainOfThought();

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground",
            className
          )}
          {...props}
        >
          <BrainIcon className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 text-left">
            {children ?? "Chain of Thought"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </CollapsibleTrigger>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
  icon?: any;
  label: ReactNode;
  description?: ReactNode;
  status?: "complete" | "active" | "pending";
  timeTaken?: string;
  stepIndex?: number;
  isFirst?: boolean;
  isLast?: boolean;
};

const stepStatusStyles = {
  active: "text-foreground",
  complete: "text-muted-foreground",
  pending: "text-muted-foreground/50",
};

const iconContainerStyles = {
  active: "text-primary drop-shadow-[0_0_6px_rgba(var(--primary)/0.5)]",
  complete: "text-muted-foreground",
  pending: "text-muted-foreground/30",
};

export const ChainTimelineColumn = memo(
  ({
    isFirst = false,
    isLast = false,
    className,
    children,
  }: {
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
    children?: ReactNode;
  }) => (
    <div className={cn("relative w-4 shrink-0 self-stretch", className)}>
      {!isFirst && (
        <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-border/60" />
      )}
      {!isLast && (
        <div className="absolute left-1/2 top-4 bottom-0 w-px -translate-x-1/2 bg-border/60" />
      )}
      {children ? (
        <div className="relative z-10 mt-0.5 flex justify-center rounded-full bg-background">{children}</div>
      ) : null}
    </div>
  )
);

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    label,
    description,
    status = "complete",
    timeTaken,
    stepIndex = 0,
    isFirst = false,
    isLast = false,
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    const [isExpanded, setIsExpanded] = useState(status === "active");
    const [mounted, setMounted] = useState(false);

    // Active/pending steps should show their heading immediately (no stagger fade-in)
    useEffect(() => {
      if (status === "active" || status === "pending") {
        setMounted(true);
        return;
      }
      const t = setTimeout(() => setMounted(true), stepIndex * 120 + 80);
      return () => clearTimeout(t);
    }, [stepIndex, status]);

    // Active step expands; completed steps collapse when the next step starts
    useEffect(() => {
      if (status === "active") setIsExpanded(true);
      else if (status === "complete") setIsExpanded(false);
    }, [status]);

    return (
      <div
        className={cn(
          "flex gap-3 text-sm group",
          stepStatusStyles[status],
          "transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
          className
        )}
        style={{ transitionDelay: mounted ? "0ms" : `${stepIndex * 120}ms` }}
        {...props}
      >
        <ChainTimelineColumn isFirst={isFirst} isLast={isLast}>
          <div
            className={cn(
              "transition-all duration-500",
              iconContainerStyles[status],
              status === "active" && "animate-pulse"
            )}
          >
            <Icon className="size-4" />
          </div>
        </ChainTimelineColumn>

        {/* Content column */}
        <Collapsible
          open={isExpanded}
          onOpenChange={setIsExpanded}
          className={cn("min-w-0 flex-1", isLast ? "pb-2" : "pb-6")}
        >
          <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 cursor-pointer group/trigger">
            {/* Label */}
            <span className="font-medium text-sm leading-snug text-left flex-1 min-w-0">
              {status === "active" ? (
                <span className="text-foreground">
                  <Shimmer duration={2}>{typeof label === "string" ? label : label as any}</Shimmer>
                </span>
              ) : (
                <span className={cn(
                  "transition-colors duration-500",
                  status === "complete" ? "text-muted-foreground" : "text-muted-foreground/40"
                )}>
                  {label}
                </span>
              )}
            </span>

            {/* Right side: time badge + chevron */}
            <div className="flex items-center gap-2 shrink-0 mt-px">
              {timeTaken && status === "complete" && (
                <span className="text-[10px] text-muted-foreground/50 font-mono bg-muted/30 px-1.5 py-0.5 rounded-full border border-border/30 transition-all duration-500 animate-in fade-in-0">
                  {timeTaken}
                </span>
              )}
              {status === "active" && (
                <span className="flex items-center gap-1 text-[10px] text-primary/60 font-mono animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-primary/60" />
                  running
                </span>
              )}
              {(description || children) && (
                <ChevronDownIcon className={cn(
                  "size-3.5 transition-transform duration-300 text-muted-foreground/40",
                  isExpanded ? "rotate-180" : ""
                )} />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="pt-2.5 space-y-2">
              {description && (
                <div className="text-muted-foreground text-xs leading-relaxed">{description}</div>
              )}
              {children}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }
);


export type ChainOfThoughtContentProps = ComponentProps<
  typeof CollapsibleContent
>;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    const { isOpen } = useChainOfThought();

    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent
          className={cn(
            "pt-2 space-y-0 relative overflow-hidden",
            "data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down text-popover-foreground outline-none",
            className
          )}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

export const ChainOfThoughtSearchResults = memo(
  ({ className, children, ...props }: ComponentProps<"div">) => (
    <div className={cn("flex flex-wrap gap-1.5", className)} {...props}>
      {children}
    </div>
  )
);

export type ChainOfThoughtSearchResultProps = ComponentProps<"button">;

export const ChainOfThoughtSearchResult = memo(
  ({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground/80 hover:bg-muted/70 hover:text-foreground transition-colors whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainTimelineColumn.displayName = "ChainTimelineColumn";
