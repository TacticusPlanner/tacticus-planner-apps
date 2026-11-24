import type { ReactNode } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { useCoarsePointer } from "../lib"

/**
 * A design-system hint on something small that has no visible name of its own (an icon chip, a
 * truncated note): a focusable button named by `label`, whose hint is a Tooltip with a mouse and a
 * Popover on touch, where hover never happens. `hint` is the richer content (lines, a heading); it
 * defaults to `label`. Use it instead of a native `title`, which keyboard and touch users never see.
 */
export function HintTrigger({
  label,
  hint,
  children,
  className,
  "data-testid": testId,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
  "data-testid"?: string
}) {
  const coarse = useCoarsePointer()
  const trigger = (
    <button
      aria-label={label}
      className={cn(
        "inline-flex cursor-default items-center rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
      data-testid={testId}
      type="button"
    >
      {children}
    </button>
  )
  const content = hint ?? label
  if (coarse) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-72 text-sm">{content}</PopoverContent>
      </Popover>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  )
}

/** A hint's content as lines: the first is its heading, the rest follow in the muted body style. */
export function HintLines({ lines }: { lines: readonly string[] }) {
  const [heading, ...rest] = lines
  return (
    <span className="grid gap-0.5">
      <span className="font-medium">{heading}</span>
      {rest.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  )
}
