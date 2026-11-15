import { useTranslation } from "react-i18next"
import type { Progression, Rank } from "@workspace/game-domain"

import { progressionText } from "@/shared/ui"

/** The localized "from → to" labels behind the marks. */
export function useMarkLabels() {
  const { t } = useTranslation(["common", "progression"])
  const fromTo = (from: string, to: string) =>
    t("myGame.collection.compare.fromTo", { from, to })
  const progression = (value: Progression) => progressionText(t, value)
  return {
    fromTo,
    rank: (from: Rank, to: Rank) =>
      fromTo(t(`progression:ranks.${from}`), t(`progression:ranks.${to}`)),
    progression: (from: Progression, to: Progression) =>
      fromTo(progression(from), progression(to)),
  }
}
