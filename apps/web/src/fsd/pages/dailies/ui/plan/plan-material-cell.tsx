import { useTranslation } from "react-i18next"
import type { BattleId } from "@workspace/game-domain"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import {
  ResourceIcon,
  type DailyRaidLocationViewModel,
  type DailyRaidResourceVisual,
} from "@/features/daily-raids"
import { EntityIcon } from "@/shared/ui"
import type { PlanCell } from "../../model/plan-day-cells"
import { UnitIcon } from "../resource-card"

const TOOLTIP_NODE_LIMIT = 4
const PORTRAIT_LIMIT = 2

export function PlanMaterialCell({
  cell,
  dimmed,
  label,
  locationsByBattleId,
  testId,
  visual,
}: {
  cell: PlanCell
  dimmed: boolean
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
            "flex min-w-0 flex-col items-center gap-1 rounded-xl border bg-card p-1.5 text-center transition-opacity focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
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
          {cell.nodes.slice(0, TOOLTIP_NODE_LIMIT).map((node) => {
            const location = locationsByBattleId.get(node.battleId)
            return (
              <li key={node.battleId} className="flex items-center gap-1">
                {location?.icon ? (
                  <EntityIcon alt="" className="size-4" src={location.icon} />
                ) : null}
                {t("plan.cell.node", {
                  campaign: location?.campaignName ?? node.battleId,
                  node: location?.nodeLabel ?? "",
                  raids: node.raidsPerformed,
                }).trim()}
              </li>
            )
          })}
        </ul>
        {cell.nodes.length > TOOLTIP_NODE_LIMIT ? (
          <span>
            {t("plan.cell.moreNodes", {
              count: cell.nodes.length - TOOLTIP_NODE_LIMIT,
            })}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
}
