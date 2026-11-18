import { useTranslation } from "react-i18next"
import { ArrowDownUp } from "lucide-react"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

/** Above the list while Sort is not Priority: dragging changes the priority order, so it is off, and
 *  one button sorts by priority again. */
export function SortBlocksReorderNotice({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <Alert data-testid="goals-sort-blocks-reorder">
      <ArrowDownUp />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span>{t("goals.order.sortBlocksReorder")}</span>
        <Button
          data-testid="goals-sort-reset"
          onClick={onReset}
          size="sm"
          variant="outline"
        >
          {t("goals.order.sortByPriority")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
