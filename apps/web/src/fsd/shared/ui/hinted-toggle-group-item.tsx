import type { ComponentProps } from "react"
import { ToggleGroupItem } from "@workspace/ui/components/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

/**
 * A toggle chip with a hover/focus hint, instead of a native `title`. A tap only toggles (touch has
 * no hover), so a chip row whose chips need explaining also gets one `HintTrigger` (?) for touch.
 * The trigger sits inside the item (`asChild`) so the item keeps its own `data-state`.
 */
export function HintedToggleGroupItem({
  hint,
  children,
  ...props
}: ComponentProps<typeof ToggleGroupItem> & { hint: string }) {
  return (
    <Tooltip>
      <ToggleGroupItem asChild {...props}>
        <TooltipTrigger disableTouchToggle>{children}</TooltipTrigger>
      </ToggleGroupItem>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}
