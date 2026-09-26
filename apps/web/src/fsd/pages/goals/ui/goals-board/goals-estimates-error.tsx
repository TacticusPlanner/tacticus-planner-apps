import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

/** Shown when the plan-aware estimates failed to load, so missing farming details are not silent. */
export function GoalsEstimatesError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      data-testid="goals-estimates-error"
    >
      <p>{t("goals.order.estimatesError")}</p>
      <Button onClick={onRetry} size="sm" variant="outline">
        {t("goals.order.estimatesRetry")}
      </Button>
    </div>
  )
}

/** Shown when the goal list itself failed to load, with a retry for the current view. */
export function GoalsFetchError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
      data-testid="goals-page-error"
      role="alert"
    >
      <p className="text-destructive">{message}</p>
      <Button onClick={onRetry} size="sm" variant="outline">
        {t("goals.retry")}
      </Button>
    </div>
  )
}
