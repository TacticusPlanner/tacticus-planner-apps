import { GripVertical } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import type { SortableRenderProps } from "./sortable-list"

/** Put on a sortable row or card so its `DragGrip` (reveal `hover`) shows while the pointer is over it
 *  or focus is inside it. */
export const SORTABLE_ITEM_GROUP = "group/sortable"

/**
 * The one drag grip for `SortableList` items: a 32px button (44px on touch) with the list's drag
 * listeners and an accessible name. `reveal="hover"` hides it until the item is hovered or holds focus
 * (with `SORTABLE_ITEM_GROUP` on the item), like Gmail's rows; a coarse pointer, which has no hover,
 * always shows it. `always` keeps it visible, for a dedicated reorder mode. Its space is kept while
 * hidden, so revealing it never shifts the row.
 */
export function DragGrip({
  dragHandle,
  label,
  reveal = "hover",
  size = "default",
  disabled = false,
  className,
  "data-testid": testId,
}: {
  dragHandle: SortableRenderProps["dragHandle"]
  label: string
  reveal?: "hover" | "always"
  /** `touch`: the larger hit area of a phone's reorder mode. */
  size?: "default" | "touch"
  disabled?: boolean
  className?: string
  "data-testid"?: string
}) {
  const { ref, attributes, listeners } = dragHandle
  return (
    <button
      {...attributes}
      {...listeners}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50",
        size === "touch" ? "size-11" : "size-8 pointer-coarse:size-11",
        reveal === "hover" &&
          "pointer-fine:opacity-0 pointer-fine:group-hover/sortable:opacity-100 pointer-fine:group-has-focus-visible/sortable:opacity-100 pointer-fine:group-data-dragging/sortable:opacity-100 pointer-fine:focus-visible:opacity-100",
        className
      )}
      data-testid={testId}
      disabled={disabled}
      ref={ref}
      type="button"
    >
      <GripVertical className={size === "touch" ? "size-6" : "size-icon"} />
    </button>
  )
}
