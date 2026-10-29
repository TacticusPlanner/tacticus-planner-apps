import type { TFunction } from "i18next"
import { rankAt } from "@workspace/game-domain"

import { progressionLabel, type GoalDetail } from "@/entities/goal"

/**
 * A goal's target as the raids pages show it under the unit: "Rank Diamond III", "Ability 50",
 * "Ascension Legendary Red Five Stars", "Unlock", "12 upgrades". The progression is localized, never
 * the wire id ("Legendary:RedFiveStars").
 */
export function dailyGoalTargetLabel(
  t: TFunction<["dailies", "progression"]>,
  detail: Pick<GoalDetail, "goalType" | "config">
): string {
  if (detail.goalType === "Rank" && detail.config.rank) {
    return t("dailies:target.rank", {
      value: rankAt(detail.config.rank.end),
    })
  }
  if (detail.goalType === "Ability" && detail.config.ability) {
    return t("dailies:target.ability", {
      value: Math.max(
        detail.config.ability.activeEnd,
        detail.config.ability.passiveEnd
      ),
    })
  }
  if (detail.goalType === "Ascension" && detail.config.progression) {
    return t("dailies:target.ascension", {
      value: progressionLabel(t, detail.config.progression.end),
    })
  }
  if (detail.goalType === "Unlock") return t("dailies:target.unlock")
  if (detail.goalType === "Upgrade" && detail.config.upgrade) {
    return t("dailies:target.upgrade", {
      value: detail.config.upgrade.targets.reduce(
        (total, target) => total + target.quantity,
        0
      ),
    })
  }
  return t("dailies:target.other", { value: detail.goalType })
}
