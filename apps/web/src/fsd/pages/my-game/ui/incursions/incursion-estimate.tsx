import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import type { CappedTierTeam } from "../../model/use-incursion-plans"

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
  const power = new Intl.NumberFormat(i18n.language).format(
    Math.round(team.power)
  )
  const hint = t("estimate.hint", { power })
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "tabular-nums",
        estimate.status === "stuck"
          ? "border-red-600/50 text-red-700 dark:text-red-400"
          : estimate.runs === 1
            ? "border-emerald-600/50 text-emerald-700 dark:text-emerald-400"
            : "border-amber-600/50 text-amber-700 dark:text-amber-400"
      )}
      title={hint}
      data-testid={testId}
      data-status={estimate.status}
    >
      {estimate.status === "clears"
        ? t("estimate.clears", { count: estimate.runs })
        : t("estimate.stuck", {
            battle: estimate.battle,
            battles: estimate.battles,
          })}
    </Badge>
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
