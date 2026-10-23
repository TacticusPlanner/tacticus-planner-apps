import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

/** Shown when a reorder was rejected because the order changed under the user. The list behind it has
 * already refreshed; the attempted move is kept and only re-applied when the user chooses to retry. */
export function OrderConflictBanner({
  onDismiss,
  onRetry,
  retrying,
}: {
  onDismiss: () => void
  onRetry: () => void
  retrying: boolean
}) {
  const { t } = useTranslation()
  return (
    <Alert data-testid="goal-order-conflict" role="alert" variant="destructive">
      <AlertTitle>{t("goals.order.conflictTitle")}</AlertTitle>
      <AlertDescription>
        {t("goals.order.conflictDescription")}
      </AlertDescription>
      <AlertAction className="flex gap-2">
        <Button
          data-testid="goal-order-conflict-retry"
          disabled={retrying}
          onClick={onRetry}
          size="sm"
          variant="outline"
        >
          {t("goals.order.retry")}
        </Button>
        <Button
          data-testid="goal-order-conflict-dismiss"
          onClick={onDismiss}
          size="sm"
          variant="ghost"
        >
          {t("goals.order.dismiss")}
        </Button>
      </AlertAction>
    </Alert>
  )
}
