import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { CappedTierTeam } from "../../model/use-incursion-plans"
import { numberFormat } from "@/shared/lib"

/**
 * How many runs the suggested team, capped to the tier's rarity, needs to clear the tier, or the
 * battle it cannot get past; titled with the capped power and how the estimate works.
 */
export function IncursionEstimate({
  team,
  detailed = false,
  "data-testid": testId,
}: {
  team: CappedTierTeam
  /** Also spell out the capped power and the first run's wins under the badge. */
  detailed?: boolean
  "data-testid"?: string
}) {
  const { t, i18n } = useTranslation("incursions")
  const { estimate } = team
  const power = numberFormat(i18n.language).format(Math.round(team.power))
  const hint = t("estimate.hint", { power })
  const badge = (
    <Tooltip>
      <TooltipTrigger asChild disableTouchToggle>
        <Badge
          variant="outline"
          className={cn(
            "tabular-nums",
            estimate.status === "stuck"
              ? "border-destructive/50 text-destructive"
              : estimate.runs === 1
                ? "border-success-foreground/50 text-success-foreground"
                : "border-warning-foreground/50 text-warning-foreground"
          )}
          data-testid={testId}
          data-status={estimate.status}
        >
          {estimate.status === "clears"
            ? t("estimate.clears", { count: estimate.runs })
            : t("estimate.stuck", { battle: estimate.battle })}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
  if (!detailed) return badge
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {badge}
        <span className="text-sm text-muted-foreground tabular-nums">
          {t("estimate.firstRun", {
            wins: estimate.firstRunWins,
            battles: estimate.battles,
            power,
          })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
