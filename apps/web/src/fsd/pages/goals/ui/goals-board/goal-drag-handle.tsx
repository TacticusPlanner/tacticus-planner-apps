import { useTranslation } from "react-i18next"

import { DragGrip } from "@/shared/ui"
import type { SortableRenderProps } from "@/shared/ui"

/** A goal's drag grip (the shared `DragGrip`), used by the desktop table row, the goal card and the
 *  mobile reorder card, so every reorder surface has the same accessible name and
 *  `goal-row-drag-handle` target. On desktop it shows on the row's hover or focus; `touch` is the
 *  always-visible, larger grip of the phone's reorder mode. */
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
  return (
    <DragGrip
      data-testid="goal-row-drag-handle"
      dragHandle={dragHandle}
      label={t("goals.columns.reorderHandle", { entity: entityName })}
      reveal={size === "touch" ? "always" : "hover"}
      size={size}
    />
  )
}
