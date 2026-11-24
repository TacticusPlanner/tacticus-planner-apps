import { useRef, useState } from "react"
import type { ComponentProps } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { isTextCut, sitsInsideControl } from "./truncated-text.model"

const CLAMP_CLASS = {
  1: "block truncate",
  2: "line-clamp-2",
  3: "line-clamp-3",
} as const

/**
 * Text cut off at one line (`truncate`) or a few (`line-clamp-*`), with the full text in a tooltip
 * that opens only while it is actually cut off. Mouse: hover. Touch: a tap toggles it, except inside
 * a link or button, where the tap keeps its own job. Screen readers already read the full text.
 */
export function TruncatedText({
  children,
  lines = 1,
  className,
  side,
  "data-testid": testId,
}: {
  children: string
  lines?: keyof typeof CLAMP_CLASS
  className?: string
  side?: ComponentProps<typeof TooltipContent>["side"]
  "data-testid"?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  // Whether the tooltip was open when this tap started: the tap's own pointerdown closes it (a tap
  // anywhere closes a touch-opened tooltip), so the click that follows must not reopen it.
  const openAtTapRef = useRef(false)
  const touchRef = useRef(false)

  return (
    <Tooltip
      onOpenChange={(next) => {
        if (next && !isTextCut(ref.current)) return
        setOpen(next)
      }}
      open={open}
    >
      <TooltipTrigger
        asChild
        disableTouchToggle
        onClick={(event) => {
          if (!touchRef.current || sitsInsideControl(ref.current)) return
          // Keep Radix's own click handler from closing what this tap opens.
          event.preventDefault()
          setOpen(!openAtTapRef.current && isTextCut(ref.current))
        }}
        onPointerDown={(event) => {
          touchRef.current = event.pointerType === "touch"
          openAtTapRef.current = open
        }}
      >
        <span
          className={cn(CLAMP_CLASS[lines], className)}
          data-testid={testId}
          ref={ref}
        >
          {children}
        </span>
      </TooltipTrigger>
      {/* Start-aligned, so the full text starts where the cut-off text does. */}
      <TooltipContent align="start" className="max-w-sm" side={side}>
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
