import { useTranslation } from "react-i18next"
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/**
 * Folds or unfolds every Group by section at once, so a long grouped plan can be scanned by its
 * headings. Reads "Expand all" only when every shown section is folded, "Collapse all" otherwise.
 * Sits in the View slot, so on mobile it is in the View sheet, labelled like on desktop.
 */
export function GoalsCollapseAllToggle({
  allCollapsed,
  onToggle,
}: {
  allCollapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const label = allCollapsed
    ? t("goals.filters.expandAllGroups")
    : t("goals.filters.collapseAllGroups")
  const Icon = allCollapsed ? ChevronsUpDown : ChevronsDownUp
  return (
    <Button
      aria-label={label}
      data-testid="goals-collapse-all"
      onClick={onToggle}
      variant="outline"
    >
      <Icon data-icon="inline-start" />
      {label}
    </Button>
  )
}
