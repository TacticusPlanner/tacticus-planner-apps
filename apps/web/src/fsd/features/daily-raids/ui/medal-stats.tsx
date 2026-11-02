import { useTranslation } from "react-i18next"

import { EntityIcon } from "@/shared/ui"

import { lightningVictoryIcon, medalIcon } from "../lib/battle-progress-icons"
import type { TrackMedalStats } from "../model/battle-progress"

/** Medals and Lightning Victories earned against the maximum, with the game's icons. */
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
    </span>
  )
}
