import { useTranslation } from "react-i18next"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** The mobile toolbar's "Reorder" button that turns the drag-only reorder cards on and off. It is
 *  labelled, like "Select goals" beside it, so neither is a bare icon. */
export function GoalsMobileReorderToggle({
  active,
  disabled = false,
  onToggle,
}: {
  active: boolean
  /** Rendered but disabled (rather than absent) while goals load or there is nothing to act on, so
   *  the toolbar doesn't shift when the list arrives. */
  disabled?: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    // The label says the mode ("Reorder" / "Done"), so no aria-pressed as well.
    <Button
      disabled={disabled}
      data-testid="goals-mobile-reorder-toggle"
      onClick={onToggle}
      variant={active ? "default" : "outline"}
    >
      <ArrowUpDown data-icon="inline-start" />
      {active
        ? t("goals.project.reorderDone")
        : t("goals.project.reorderGoals")}
    </Button>
  )
}
