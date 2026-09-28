import { useTranslation } from "react-i18next"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** The mobile control row's icon-only button that turns the drag-only reorder cards on and off. */
export function GoalsMobileReorderToggle({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <Button
      aria-label={
        active
          ? t("goals.project.reorderDone")
          : t("goals.project.reorderGoals")
      }
      aria-pressed={active}
      data-testid="goals-mobile-reorder-toggle"
      onClick={onToggle}
      size="sm"
      variant={active ? "default" : "outline"}
    >
      <ArrowUpDown data-icon="inline-start" />
    </Button>
  )
}
