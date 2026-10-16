import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  progressionRarity,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type {
  LegendaryEventGoalRef,
  LegendaryEventGoalTarget,
  UpgradeStep,
} from "@/entities/legendary-event"

export interface GoalLabels {
  /** "Legendary Red Three Stars". */
  progression: (value: Progression) => string
  /** "Gold II". */
  rank: (value: Rank) => string
  /** One badge line per goal: "Rank to Gold II", "Ascension to Legendary Red Three Stars". */
  badgeLines: (target: LegendaryEventGoalTarget | undefined) => string[]
  /** "Unlock", "Rank to Gold II", "Ascension to Epic Red Three Stars". */
  step: (step: UpgradeStep) => string
}

/** Localized goal and step labels shared by the badge, the Upgrade impact rows and the preview. */
export function useGoalLabels(): GoalLabels {
  const { t } = useTranslation(["legendaryEvents", "progression"])
  const progression = useCallback(
    (value: Progression) => {
      const stars = value.slice(value.indexOf(":") + 1)
      return t("goalBadge.progression", {
        rarity: t(`progression:rarities.${progressionRarity(value)}`),
        stars: t(`progression:stars.${stars}`, { defaultValue: stars }),
      })
    },
    [t]
  )
  const rank = useCallback(
    (value: Rank) => t(`progression:ranks.${value}`, { defaultValue: value }),
    [t]
  )
  const goalLine = useCallback(
    (goal: LegendaryEventGoalRef): string | undefined => {
      switch (goal.kind) {
        case "Unlock":
          return t("goalBadge.unlock")
        case "Ascension":
          return goal.progressionEnd
            ? t("goalBadge.ascension", {
                target: progression(goal.progressionEnd),
              })
            : undefined
        case "Rank":
          if (!goal.rankEnd) return undefined
          return goal.appliedUpgradesEnd
            ? t("goalBadge.rankWithUpgrades", {
                target: rank(goal.rankEnd),
                count: goal.appliedUpgradesEnd,
              })
            : t("goalBadge.rank", { target: rank(goal.rankEnd) })
        case "Ability":
          return t("goalBadge.ability", {
            active: goal.activeEnd ?? "—",
            passive: goal.passiveEnd ?? "—",
          })
      }
    },
    [t, progression, rank]
  )
  return useMemo(
    () => ({
      progression,
      rank,
      badgeLines: (target) =>
        (target?.goals ?? []).flatMap((goal) => {
          const line = goalLine(goal)
          return line ? [line] : []
        }),
      step: (step) => {
        if (step.kind === "unlock") return t("upgradeImpact.unlock")
        if (step.kind === "rank") {
          return t("upgradeImpact.rank", { target: rank(step.rank) })
        }
        return t("upgradeImpact.ascension", {
          target: progression(step.progression),
        })
      },
    }),
    [t, progression, rank, goalLine]
  )
}
