import { useTranslation } from "react-i18next"
import { ListChecks } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

/** "Select goals" in the toolbar's Find slot, the same control as Collection's "Select units": it
 *  starts select mode (checkboxes on the goals and the select bar), which the bar's Done ends. */
export function GoalsSelectButton({
  disabled = false,
  onSelect,
}: {
  /** Rendered but disabled (rather than absent) while goals load or there is nothing to select, so
   *  the toolbar doesn't shift when the list arrives. */
  disabled?: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  return (
    <Button
      data-testid="goals-select-toggle"
      disabled={disabled}
      onClick={onSelect}
      variant="outline"
    >
      <ListChecks data-icon="inline-start" />
      {t("goals.bulk.selectMode")}
    </Button>
  )
}
