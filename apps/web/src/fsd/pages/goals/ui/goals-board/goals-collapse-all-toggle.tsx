import { useTranslation } from "react-i18next"
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

/**
 * Folds or unfolds every Group by section at once, so a long grouped plan can be scanned by its
 * headings. Reads "Expand all" only when every shown section is folded, "Collapse all" otherwise.
 * Icon plus label on desktop, icon-only with an accessible name below the 768px breakpoint, like
 * the other mobile toolbar controls.
 */
export function GoalsCollapseAllToggle({
  allCollapsed,
  onToggle,
}: {
  allCollapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const label = allCollapsed
    ? t("goals.filters.expandAllGroups")
    : t("goals.filters.collapseAllGroups")
  const Icon = allCollapsed ? ChevronsUpDown : ChevronsDownUp
  return (
    <Button
      aria-label={label}
      data-testid="goals-collapse-all"
      onClick={onToggle}
      size="sm"
      title={isMobile ? label : undefined}
      variant="outline"
    >
      <Icon data-icon="inline-start" />
      {isMobile ? null : label}
    </Button>
  )
}
