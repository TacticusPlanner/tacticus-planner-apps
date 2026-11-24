import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import { EntityIcon } from "@/shared/ui"

import {
  lightningVictoryIcon,
  medalIcon,
  milestoneIcons,
} from "../lib/battle-progress-icons"
import type { TrackMedalStats } from "../model/battle-progress"

/** Medals, Lightning Victories and (where tracked) Gold milestones earned against the maximum. */
export function MedalStats({ stats }: { stats: TrackMedalStats }) {
  const { t } = useTranslation("dailies")
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums">
      <MedalStat label={t("battleProgress.medalsEarned")}>
        <EntityIcon
          size="inline"
          alt={t("battleProgress.medalsEarned")}
          src={medalIcon}
        />
        {stats.medals}/{stats.maxMedals}
      </MedalStat>
      {stats.maxLightningVictories > 0 ? (
        <MedalStat label={t("battleProgress.lightningVictory")}>
          <EntityIcon
            size="inline"
            alt={t("battleProgress.lightningVictory")}
            src={lightningVictoryIcon}
          />
          {stats.lightningVictories}/{stats.maxLightningVictories}
        </MedalStat>
      ) : null}
      {(stats.maxGoldMilestones ?? 0) > 0 ? (
        <MedalStat label={t("battleProgress.goldMilestones")}>
          <EntityIcon
            size="inline"
            alt={t("battleProgress.goldMilestones")}
            src={milestoneIcons.Gold}
          />
          {stats.goldMilestones ?? 0}/{stats.maxGoldMilestones}
        </MedalStat>
      ) : null}
    </span>
  )
}

/** One stat: an icon (its alt names it for screen readers) and a count. Hover names it too; a tap
 *  keeps opening the battle progress the stats usually sit on. */
function MedalStat({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild disableTouchToggle>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
