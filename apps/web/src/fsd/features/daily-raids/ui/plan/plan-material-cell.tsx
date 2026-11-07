import { Lock } from "lucide-react"
import { ResourceIcon } from "../resource-icon"
import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceVisual,
} from "../../model/daily-raids.domain"
import { CampaignLocationName, EntityIcon } from "@/shared/ui"
import type { PlanCell } from "../../model/plan-day-cells"
import { planCellAlternatives } from "../../model/plan-cell-alternatives"
import { ManualBattleBadge } from "../manual-battle"
import { UnitIcon } from "../resource-card"

const TOOLTIP_NODE_LIMIT = 4
const PORTRAIT_LIMIT = 2
const ALTERNATIVE_LIMIT = 4

export function PlanMaterialCell({
  cell,
  dimmed,
  eligibleBattleIds,
  farmLocationsByResource,
  label,
  locationsByBattleId,
  testId,
  visual,
}: {
  cell: PlanCell
  dimmed: boolean
  eligibleBattleIds: ReadonlySet<BattleId>
  farmLocationsByResource: ReadonlyMap<string, readonly BattleId[]>
  label: string
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  testId: string
  visual: DailyRaidResourceVisual | undefined
}) {
  const { t } = useTranslation("dailies")
  const satisfied = cell.owned >= cell.target
  const extraUnits = cell.units.length - PORTRAIT_LIMIT

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={t("plan.cell.label", {
            material: label,
            owned: cell.owned,
            target: cell.target,
          })}
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 rounded-lg border bg-card p-1.5 text-center transition-opacity focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            dimmed && "opacity-30"
          )}
          data-dimmed={dimmed || undefined}
          data-testid={testId}
          type="button"
        >
          <ResourceIcon className="size-10" label={label} visual={visual} />
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
              <UnitIcon key={unit.unitId} className="size-6" goal={unit} />
            ))}
            {extraUnits > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {t("plan.cell.moreUnits", { count: extraUnits })}
              </span>
            ) : null}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        className="flex-col items-start"
        data-testid="plan-tooltip"
      >
        <span className="font-semibold">{label}</span>
        <span>{cell.units.map((unit) => unit.unitLabel).join(", ")}</span>
        <ul className="space-y-0.5">
          {cell.nodes.slice(0, TOOLTIP_NODE_LIMIT).map((node) => (
            <li key={node.battleId} className="flex items-center gap-1">
              <PlanNodeLocation
                battleId={node.battleId}
                location={locationsByBattleId.get(node.battleId)}
              />{" "}
              {t("plan.cell.nodeRaids", { raids: node.raidsPerformed })}
            </li>
          ))}
        </ul>
        {cell.nodes.length > TOOLTIP_NODE_LIMIT ? (
          <span>
            {t("plan.cell.moreNodes", {
              count: cell.nodes.length - TOOLTIP_NODE_LIMIT,
            })}
          </span>
        ) : null}
        <PlanCellAlternatives
          cell={cell}
          eligibleBattleIds={eligibleBattleIds}
          farmLocationsByResource={farmLocationsByResource}
          locationsByBattleId={locationsByBattleId}
          testId={`${testId}-alternatives`}
        />
      </TooltipContent>
    </Tooltip>
  )
}

/** The other campaign nodes that drop the cell's material — rendered only while the tooltip is open. */
function PlanCellAlternatives({
  cell,
  eligibleBattleIds,
  farmLocationsByResource,
  locationsByBattleId,
  testId,
}: {
  cell: PlanCell
  eligibleBattleIds: ReadonlySet<BattleId>
  farmLocationsByResource: ReadonlyMap<string, readonly BattleId[]>
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
  testId: string
}) {
  const { t } = useTranslation("dailies")
  const alternatives = planCellAlternatives(
    cell,
    farmLocationsByResource,
    eligibleBattleIds
  )
  if (alternatives.length === 0) return null

  return (
    <div className="mt-1 space-y-0.5" data-testid={testId}>
      <span className="font-semibold">{t("plan.cell.alternatives")}</span>
      <ul className="space-y-0.5">
        {alternatives.slice(0, ALTERNATIVE_LIMIT).map((alternative) => (
          <li
            key={alternative.battleId}
            className={cn(
              "flex items-center gap-1",
              alternative.locked && "opacity-70"
            )}
            data-locked={alternative.locked || undefined}
          >
            <PlanNodeLocation
              battleId={alternative.battleId}
              location={locationsByBattleId.get(alternative.battleId)}
            />
            {alternative.locked ? (
              <Lock
                aria-label={t("plan.cell.locked")}
                className="size-3 shrink-0"
                role="img"
              />
            ) : null}
          </li>
        ))}
      </ul>
      {alternatives.length > ALTERNATIVE_LIMIT ? (
        <span>
          {t("plan.cell.moreNodes", {
            count: alternatives.length - ALTERNATIVE_LIMIT,
          })}
        </span>
      ) : null}
    </div>
  )
}

function PlanNodeLocation({
  battleId,
  location,
}: {
  battleId: BattleId
  location: DailyRaidLocationViewModel | undefined
}) {
  return (
    <>
      {location?.icon ? (
        <EntityIcon alt="" className="size-4" src={location.icon} />
      ) : null}
      <span>
        <CampaignLocationName
          campaignName={location?.campaignName ?? battleId}
          difficultyLabel={location?.difficultyLabel}
          nodeLabel={location?.nodeLabel}
        />
      </span>
      {location?.manual ? <ManualBattleBadge compact /> : null}
    </>
  )
}
