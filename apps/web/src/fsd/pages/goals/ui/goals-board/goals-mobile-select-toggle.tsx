import { useTranslation } from "react-i18next"
import { ListChecks } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** The mobile control row's icon-only button that turns select mode (checkbox cards + bulk bar) on and off. */
export function GoalsMobileSelectToggle({
  active,
  disabled = false,
  onToggle,
}: {
  active: boolean
  /** Rendered but disabled (rather than absent) while goals load or there is nothing to act on, so
   *  the control row doesn't shift when the list arrives. */
  disabled?: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <Button
      aria-label={t("goals.bulk.selectMode")}
      aria-pressed={active}
      disabled={disabled}
      data-testid="goals-mobile-select-toggle"
      onClick={onToggle}
      size="sm"
      variant={active ? "default" : "outline"}
    >
      <ListChecks data-icon="inline-start" />
    </Button>
  )
}
