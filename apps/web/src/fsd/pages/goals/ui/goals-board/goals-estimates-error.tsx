import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

/** Shown when the plan-aware estimates failed to load, so missing farming details are not silent. */
function GoalsEstimatesError({ onRetry }: { onRetry: () => void }) {
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

/** The notices that resolve after the rows (estimates failed, no farmable demand). The page renders
 *  them below the list, not above it, so their late arrival never pushes the rows down. */
export function GoalsLateNotices({
  insightsRun,
  hasActiveGoals,
}: {
  insightsRun: {
    loading: boolean
    isError: boolean
    retry: () => void
    result: { estimates: ReadonlyMap<string, unknown> }
  }
  hasActiveGoals: boolean
}) {
  const { t } = useTranslation()
  // Active goals exist but the plan has nothing farmable to estimate for them.
  const noFarmableDemand =
    !insightsRun.loading &&
    !insightsRun.isError &&
    insightsRun.result.estimates.size === 0 &&
    hasActiveGoals
  return (
    <>
      {insightsRun.isError ? (
        <GoalsEstimatesError onRetry={insightsRun.retry} />
      ) : null}
      {noFarmableDemand ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="goals-no-farmable"
        >
          {t("goals.order.noFarmableDemand")}
        </p>
      ) : null}
    </>
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
