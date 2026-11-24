import type { ComponentProps } from "react"
import { cn } from "@workspace/ui/lib/utils"

/**
 * The one surface for a bar that floats over a page (a selection bar, unsaved changes, a running
 * total, a reorder mode's Done): the popover background with a primary ring and a large shadow, so it
 * reads clearly above cards in both themes. Positioning (sticky top or bottom, offsets) is the caller's.
 */
export function FloatingBar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "z-20 rounded-2xl bg-popover text-popover-foreground shadow-lg ring-1 ring-primary",
        className
      )}
      {...props}
    />
  )
}
