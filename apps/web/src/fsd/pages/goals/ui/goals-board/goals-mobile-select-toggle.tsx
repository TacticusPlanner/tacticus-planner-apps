import { useTranslation } from "react-i18next"
import { ListChecks } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** The mobile control row's icon-only button that turns select mode (checkbox cards + bulk bar) on and off. */
export function GoalsMobileSelectToggle({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <Button
      aria-label={t("goals.bulk.selectMode")}
      aria-pressed={active}
      data-testid="goals-mobile-select-toggle"
      onClick={onToggle}
      size="sm"
      variant={active ? "default" : "outline"}
    >
      <ListChecks data-icon="inline-start" />
    </Button>
  )
}
