import { useTranslation } from "react-i18next"
import { onslaughtTokenIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"
import type { PlanOnslaughtRun } from "../../model/plan-day-cells"
import { UnitIcon } from "../resource-card"

// Expected values are fractional; show at most one decimal so "2" never reads "2.0".
const rounded = (value: number) => Number(value.toFixed(1))

/** A day card's "Onslaught" section (spec: day cards list Onslaught runs after the shop purchases):
 *  divider plus one row per unit. Rendered only when the day has a projected run. */
export function PlanOnslaughtRuns({
  day,
  runs,
  selectedUnitId,
}: {
  day: number
  runs: PlanOnslaughtRun[]
  selectedUnitId: string | undefined
}) {
  const { t } = useTranslation("dailies")
  if (runs.length === 0) return null

  return (
    <>
      <div
        className="flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground uppercase"
        data-testid={`plan-day-${day}-onslaught-divider`}
      >
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <h3>{t("plan.onslaught")}</h3>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <OnslaughtRunList
        rowTestId={(unitId) => `plan-onslaught-${day}-${unitId}`}
        runs={runs}
        selectedUnitId={selectedUnitId}
        testId={`plan-day-${day}-onslaught`}
      />
    </>
  )
}

/** One row per unit with its expected Onslaught runs and shards: a Schedule day card's Onslaught
 *  section and Dailies > Raids' Onslaught lane both list runs this way. */
export function OnslaughtRunList({
  runs,
  selectedUnitId,
  testId,
  rowTestId,
}: {
  runs: PlanOnslaughtRun[]
  selectedUnitId?: string
  testId: string
  rowTestId: (unitId: string) => string
}) {
  const { t } = useTranslation("dailies")

  return (
    <ul className="space-y-1.5" data-testid={testId}>
      {runs.map((run) => {
        const dimmed =
          selectedUnitId !== undefined && run.unit.unitId !== selectedUnitId
        const values = {
          unit: run.unit.unitLabel,
          runs: rounded(run.runs),
          shards: rounded(run.shards),
        }
        return (
          <li
            key={run.unit.unitId}
            aria-label={t("plan.onslaughtRun.label", values)}
            className={cn(
              "flex items-center gap-2 rounded-lg border bg-card p-1.5 transition-opacity",
              dimmed && "opacity-30"
            )}
            data-dimmed={dimmed || undefined}
            data-testid={rowTestId(run.unit.unitId)}
          >
            <UnitIcon className="size-8 rounded-full" goal={run.unit} />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground tabular-nums">
              {t("plan.onslaughtRun.expected", values)}
            </span>
            <EntityIcon alt="" className="size-5" src={onslaughtTokenIcon()} />
          </li>
        )
      })}
    </ul>
  )
}
