import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import { DetailsOverlay } from "@/shared/ui"

import type {
  DailyRaidResourceVisual,
  DailyRaidsReadyViewModel,
} from "../../model/daily-raids.domain"
import { useMaterialDetailsSource } from "../../model/material-details-context"
import type { PlanCell } from "../../model/plan-day-cells"
import { MaterialDetails, WithLockedNodes } from "../material-details"
import { ResourceIcon } from "../resource-icon"
import { UnitIcon } from "../resource-card"

const PORTRAIT_LIMIT = 2

/** One material a Schedule day raids: its icon, have / need and the units it serves. A click or tap
 *  opens its details (the day's raids for it and every other source). */
export function PlanMaterialCell({
  cell,
  dimmed,
  exhaustedBattleIds,
  label,
  raids,
  testId,
  visual,
}: {
  cell: PlanCell
  dimmed: boolean
  exhaustedBattleIds: ReadonlySet<BattleId>
  label: string
  raids: Pick<
    DailyRaidsReadyViewModel,
    "sourcesByResource" | "eligibleBattleIds" | "locationsByBattleId"
  >
  testId: string
  visual: DailyRaidResourceVisual | undefined
}) {
  const { t } = useTranslation("dailies")
  const source = useMaterialDetailsSource()
  const satisfied = cell.owned >= cell.target
  const extraUnits = cell.units.length - PORTRAIT_LIMIT

  return (
    <DetailsOverlay
      testId={`${testId}-details`}
      title={label}
      tooltip={label}
      trigger={
        <button
          aria-label={t("plan.cell.label", {
            material: label,
            owned: cell.owned,
            target: cell.target,
          })}
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 rounded-lg border bg-card p-1.5 text-center transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            dimmed && "opacity-30"
          )}
          data-dimmed={dimmed || undefined}
          data-testid={testId}
          type="button"
        >
          <ResourceIcon label={label} visual={visual} />
          <Badge
            className={cn(
              "tabular-nums",
              satisfied
                ? "bg-success text-success-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
            data-testid={`${testId}-progress`}
          >
            {cell.owned}/{cell.target}
          </Badge>
          <span className="flex items-center gap-0.5">
            {cell.units.slice(0, PORTRAIT_LIMIT).map((unit) => (
              <UnitIcon key={unit.unitId} size="inline" goal={unit} />
            ))}
            {extraUnits > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {t("plan.cell.moreUnits", { count: extraUnits })}
              </span>
            ) : null}
          </span>
        </button>
      }
    >
      <WithLockedNodes resourceId={cell.resourceId} source={source}>
        {(lockedNodes) => (
          <MaterialDetails
            cell={cell}
            exhaustedBattleIds={exhaustedBattleIds}
            lockedNodes={lockedNodes}
            raids={raids}
            testId={testId}
          />
        )}
      </WithLockedNodes>
    </DetailsOverlay>
  )
}
