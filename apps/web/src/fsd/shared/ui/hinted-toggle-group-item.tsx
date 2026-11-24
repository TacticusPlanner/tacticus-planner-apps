import type { ComponentProps } from "react"
import { ToggleGroupItem } from "@workspace/ui/components/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A toggle chip with a hover/focus hint, instead of a native `title`. A tap only toggles (touch has
 * no hover), so a chip row whose chips need explaining also gets one `HintTrigger` (?) for touch.
 * The trigger sits inside the item (`asChild`) so the item keeps its own `data-state`.
 *
 * With `disabledReason` the chip can't be pressed but stays focusable and hoverable
 * (`aria-disabled`), and every pointer (a tap too) shows the reason instead of the hint.
 */
export function HintedToggleGroupItem({
  hint,
  disabledReason,
  className,
  children,
  ...props
}: ComponentProps<typeof ToggleGroupItem> & {
  hint: string
  disabledReason?: string
}) {
  const blocked = disabledReason !== undefined
  return (
    <Tooltip>
      <ToggleGroupItem
        asChild
        aria-disabled={blocked || undefined}
        className={cn(
          "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
          className
        )}
        {...props}
      >
        <TooltipTrigger
          disableTouchToggle={!blocked}
          // A blocked chip ignores the press, and its reason stays open (Radix closes a tooltip on
          // pointerdown and on click unless the event is cancelled).
          onClick={blocked ? (event) => event.preventDefault() : undefined}
          onPointerDown={
            blocked
              ? (event) => {
                  if (event.pointerType !== "touch") event.preventDefault()
                }
              : undefined
          }
        >
          {children}
        </TooltipTrigger>
      </ToggleGroupItem>
      <TooltipContent>{disabledReason ?? hint}</TooltipContent>
    </Tooltip>
  )
}
