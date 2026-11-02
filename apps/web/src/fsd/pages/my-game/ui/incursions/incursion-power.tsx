import { useTranslation } from "react-i18next"
import { powerIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import { powerStanding } from "../../model/incursion-plan.model"

const STANDING_CLASS = {
  even: "text-emerald-700 dark:text-emerald-400",
  harder: "text-amber-700 dark:text-amber-400",
  hard: "text-red-700 dark:text-red-400",
} as const

/**
 * Enemy power with the game's power fist; with the team's power, coloured by how the two compare
 * and titled with the ratio. A guide, not a clear prediction.
 */
export function IncursionPower({
  power,
  teamPower,
  className,
  "data-testid": testId,
}: {
  power: number
  teamPower?: number
  className?: string
  "data-testid"?: string
}) {
  const { t, i18n } = useTranslation("incursions")
  const number = new Intl.NumberFormat(i18n.language)
  const standing =
    teamPower && teamPower > 0 ? powerStanding(power, teamPower) : undefined
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        standing && STANDING_CLASS[standing],
        className
      )}
      title={
        standing && teamPower
          ? t("power.vsTeam", {
              ratio: new Intl.NumberFormat(i18n.language, {
                maximumFractionDigits: 1,
              }).format(power / teamPower),
            })
          : t("power.enemy")
      }
      data-testid={testId}
      data-standing={standing}
    >
      <EntityIcon src={powerIcon()} alt="" className="size-4 shrink-0" />
      {number.format(Math.round(power))}
    </span>
  )
}
