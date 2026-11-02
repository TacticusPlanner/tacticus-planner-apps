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
    <span className="inline-flex items-center gap-3 text-xs tabular-nums">
      <span
        className="inline-flex items-center gap-1"
        title={t("battleProgress.medalsEarned")}
      >
        <EntityIcon
          alt={t("battleProgress.medalsEarned")}
          src={medalIcon}
          className="size-4"
        />
        {stats.medals}/{stats.maxMedals}
      </span>
      {stats.maxLightningVictories > 0 ? (
        <span
          className="inline-flex items-center gap-1"
          title={t("battleProgress.lightningVictory")}
        >
          <EntityIcon
            alt={t("battleProgress.lightningVictory")}
            src={lightningVictoryIcon}
            className="size-4"
          />
          {stats.lightningVictories}/{stats.maxLightningVictories}
        </span>
      ) : null}
      {stats.maxGoldMilestones ? (
        <span
          className="inline-flex items-center gap-1"
          title={t("battleProgress.goldMilestones")}
        >
          <EntityIcon
            alt={t("battleProgress.goldMilestones")}
            src={milestoneIcons.Gold}
            className="size-4"
          />
          {stats.goldMilestones ?? 0}/{stats.maxGoldMilestones}
        </span>
      ) : null}
    </span>
  )
}
