import type { LucideIcon } from "lucide-react"
import { LayoutGrid, Rows3 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { afterNextPaint } from "@/shared/lib"

import type { GoalsView } from "./use-goals-view"

const viewOptions: {
  value: GoalsView
  icon: LucideIcon
  labelKey: "goals.view.cards" | "goals.view.table"
}[] = [
  { value: "Cards", icon: LayoutGrid, labelKey: "goals.view.cards" },
  { value: "Table", icon: Rows3, labelKey: "goals.view.table" },
]

/**
 * The Table/Cards switch in the Goals toolbar (goal-list-layout), on desktop and mobile. The view is
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
    <ToggleGroup
      aria-label={t("goals.view.label")}
      data-testid="goals-view-toggle"
      disabled={disabled}
      onValueChange={(value) => {
        // Radix emits "" when the pressed item is clicked again; the view can't be unset.
        if (!value) return
        const next = value as GoalsView
        setShown(next)
        afterNextPaint(() => onViewChange(next))
      }}
      spacing={0}
      type="single"
      value={shown}
      variant="outline"
    >
      {/* A native title, not a Radix Tooltip: a tooltip trigger would overwrite the item's
          data-state, which drives its pressed styling. */}
      {viewOptions.map(({ value, icon: Icon, labelKey }) => (
        <ToggleGroupItem
          aria-label={t(labelKey)}
          data-testid={`goals-view-${value.toLowerCase()}`}
          key={value}
          size="sm"
          title={t(labelKey)}
          value={value}
        >
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
