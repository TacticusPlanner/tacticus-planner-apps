import type { TFunction } from "i18next"
import { rankAt } from "@workspace/game-domain"

import { progressionLabel } from "@/entities/goal"
import type { GoalDetail } from "@/entities/goal"

/**
 * A goal's target as the raids pages show it under the unit: "Rank Diamond III", "Ability 50",
 * "Ascension Legendary 5★", "Unlock", "12 upgrades". The progression is localized, never
 * the wire id ("Legendary:RedFiveStars").
 */
export function dailyGoalTargetLabel(
  t: TFunction<["dailies", "progression"]>,
  detail: Pick<GoalDetail, "goalType" | "config">
): string {
  if (detail.goalType === "Rank" && detail.config.rank) {
    const rank = rankAt(detail.config.rank.end)
    return t("dailies:target.rank", {
      value: t(`progression:ranks.${rank}`, { defaultValue: rank }),
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
