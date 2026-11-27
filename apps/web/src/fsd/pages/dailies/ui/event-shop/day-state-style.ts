import type { PlannedItemState } from "@/features/shops/event-planner"

/** The planned-state colours shared by the calendar's icons, the chips' dots and the legend. */
export const STATE_RING: Record<PlannedItemState, string> = {
  bought: "ring-success-foreground",
  toBuy: "ring-primary",
  needsReview: "ring-destructive",
}
export const STATE_DOT: Record<PlannedItemState | "none", string> = {
  bought: "bg-success-foreground",
  toBuy: "bg-primary",
  needsReview: "bg-destructive",
  none: "bg-transparent",
}

/** The red for removing things (ui-style-guide rule 12). */
export const DESTRUCTIVE_TEXT =
  "text-destructive hover:bg-destructive/10 hover:text-destructive"

/** Small controls grow to the touch size on a coarse pointer (UI sizing: 40 px visual). */
export const TOUCH_SM = "pointer-coarse:h-10"
export const TOUCH_ICON = "pointer-coarse:size-10"
