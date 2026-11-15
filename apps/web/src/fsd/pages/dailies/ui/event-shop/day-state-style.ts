import type { PlannedItemState } from "@/features/shops/event-planner"

/** The planned-state colours shared by the calendar's icons, the chips' dots and the legend. */
export const STATE_RING: Record<PlannedItemState, string> = {
  bought: "ring-emerald-600 dark:ring-emerald-400",
  toBuy: "ring-primary",
  needsReview: "ring-destructive",
}
export const STATE_DOT: Record<PlannedItemState | "none", string> = {
  bought: "bg-emerald-600 dark:bg-emerald-400",
  toBuy: "bg-primary",
  needsReview: "bg-destructive",
  none: "bg-transparent",
}

/** The warning red for removing things: readable on both themes (the theme's destructive red is too
 *  dark on the dark background for small text). */
export const DESTRUCTIVE_TEXT =
  "text-red-700 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:text-red-400"

/** Small controls grow to the touch size on a coarse pointer (UI sizing: 40 px visual). */
export const TOUCH_SM = "pointer-coarse:h-10"
export const TOUCH_ICON = "pointer-coarse:size-10"
