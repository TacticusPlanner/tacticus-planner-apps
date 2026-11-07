import { useTranslation } from "react-i18next"
import {
  progressionRarity,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import { progressionStarsKey } from "./compare-labels"

/** The localized "from → to" labels behind the marks. */
export function useMarkLabels() {
  const { t } = useTranslation(["common", "progression"])
  const fromTo = (from: string, to: string) =>
    t("myGame.collection.compare.fromTo", { from, to })
  const progression = (value: Progression) =>
    `${t(`progression:rarities.${progressionRarity(value)}`)} ${t(
      `progression:stars.${progressionStarsKey(value)}`
    )}`
  return {
    fromTo,
    rank: (from: Rank, to: Rank) =>
      fromTo(t(`progression:ranks.${from}`), t(`progression:ranks.${to}`)),
    progression: (from: Progression, to: Progression) =>
      fromTo(progression(from), progression(to)),
  }
}
