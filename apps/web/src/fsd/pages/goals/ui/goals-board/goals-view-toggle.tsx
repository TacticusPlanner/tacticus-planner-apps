import type { LucideIcon } from "lucide-react"
import { LayoutGrid, Rows3 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { afterNextPaint } from "@/shared/lib"
import { SegmentedControl } from "@/shared/ui"

import type { GoalsView } from "../../model/goals-board/use-goals-view"

const viewOptions: {
  value: GoalsView
  icon: LucideIcon
  labelKey: "goals.view.cards" | "goals.view.table"
}[] = [
  { value: "Cards", icon: LayoutGrid, labelKey: "goals.view.cards" },
  { value: "Table", icon: Rows3, labelKey: "goals.view.table" },
]

/**
 * Layout (Cards / Table) in the Goals toolbar's View slot (goal-list-layout), the shared labelled
 * segmented control. The view is
 * an external store, whose updates always render synchronously, and a switch re-renders the whole
 * list. So the switch shows the new view at once and hands it to `onViewChange` after that paint.
 */
export function GoalsViewToggle({
  view,
  onViewChange,
  disabled = false,
}: {
  view: GoalsView
  onViewChange: (view: GoalsView) => void
  /** Phone reorder mode always shows its own list, so a switch there would have no visible effect. */
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(view)
  const [committed, setCommitted] = useState(view)
  if (committed !== view) {
    setCommitted(view)
    setShown(view)
  }
  return (
    <SegmentedControl
      disabled={disabled}
      label={t("pageToolbar.layout")}
      onValueChange={(next) => {
        setShown(next)
        afterNextPaint(() => onViewChange(next))
      }}
      options={viewOptions.map(({ value, icon: Icon, labelKey }) => ({
        value,
        label: t(labelKey),
        icon: <Icon aria-hidden />,
        testId: `goals-view-${value.toLowerCase()}`,
      }))}
      testId="goals-view-toggle"
      value={shown}
    />
  )
}
