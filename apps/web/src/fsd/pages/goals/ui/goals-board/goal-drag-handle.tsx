import { useTranslation } from "react-i18next"
import { GripVertical } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import type { SortableRenderProps } from "@/shared/ui"

/** A goal's drag grip, shared by the desktop table row, the goal card and the mobile reorder card, so
 *  every reorder surface has the same accessible name, focus ring and `goal-row-drag-handle` target.
 *  `touch` is the larger mobile reorder-mode hit area. */
export function GoalDragHandle({
  dragHandle,
  entityName,
  size = "default",
}: {
  dragHandle: SortableRenderProps["dragHandle"]
  entityName: string
  size?: "default" | "touch"
}) {
  const { t } = useTranslation()
  const { ref, attributes, listeners } = dragHandle
  return (
    <button
      {...attributes}
      {...listeners}
      aria-label={t("goals.columns.reorderHandle", { entity: entityName })}
      className={cn(
        "cursor-grab touch-none rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring active:cursor-grabbing",
        size === "touch" ? "p-2" : "p-1"
      )}
      data-testid="goal-row-drag-handle"
      ref={ref}
      type="button"
    >
      <GripVertical className={size === "touch" ? undefined : "size-4"} />
    </button>
  )
}
