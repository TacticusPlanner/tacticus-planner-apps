import { useTranslation } from "react-i18next"

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
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap"
        title={t("battleProgress.medalsEarned")}
      >
        <EntityIcon
          size="inline"
          alt={t("battleProgress.medalsEarned")}
          src={medalIcon}
        />
        {stats.medals}/{stats.maxMedals}
      </span>
      {stats.maxLightningVictories > 0 ? (
        <span
          className="inline-flex items-center gap-1 whitespace-nowrap"
          title={t("battleProgress.lightningVictory")}
        >
          <EntityIcon
            size="inline"
            alt={t("battleProgress.lightningVictory")}
            src={lightningVictoryIcon}
          />
          {stats.lightningVictories}/{stats.maxLightningVictories}
        </span>
      ) : null}
      {(stats.maxGoldMilestones ?? 0) > 0 ? (
        <span
          className="inline-flex items-center gap-1 whitespace-nowrap"
          title={t("battleProgress.goldMilestones")}
        >
          <EntityIcon
            size="inline"
            alt={t("battleProgress.goldMilestones")}
            src={milestoneIcons.Gold}
          />
          {stats.goldMilestones ?? 0}/{stats.maxGoldMilestones}
        </span>
      ) : null}
    </span>
  )
}
