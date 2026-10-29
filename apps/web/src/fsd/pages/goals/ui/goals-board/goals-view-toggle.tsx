import type { LucideIcon } from "lucide-react"
import { LayoutGrid, Rows3 } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import type { GoalsView } from "@/entities/planning-setting"

const viewOptions: {
  value: GoalsView
  icon: LucideIcon
  labelKey: "goals.view.cards" | "goals.view.table"
}[] = [
  { value: "Cards", icon: LayoutGrid, labelKey: "goals.view.cards" },
  { value: "Table", icon: Rows3, labelKey: "goals.view.table" },
]

/** The desktop Table/Cards switch in the Goals filters row (goal-list-layout). Mobile has no toggle. */
export function GoalsViewToggle({
  view,
  disabled = false,
  onViewChange,
}: {
  view: GoalsView
  /** Rendered but disabled while the stored view loads, so the filters row doesn't shift. */
  disabled?: boolean
  onViewChange: (view: GoalsView) => void
}) {
  const { t } = useTranslation()
  return (
    <ToggleGroup
      aria-label={t("goals.view.label")}
      data-testid="goals-view-toggle"
      disabled={disabled}
      onValueChange={(value) => {
        // Radix emits "" when the pressed item is clicked again; the view can't be unset.
        if (value) onViewChange(value as GoalsView)
      }}
      spacing={0}
      type="single"
      value={view}
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
