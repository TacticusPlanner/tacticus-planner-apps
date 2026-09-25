import type { TFunction } from "i18next"

import { describeRankTargetKey, type GoalKind } from "@/entities/goal"

/** "Silver3" or "Silver3 (3/6)" — the Rank end target a normalized target key stands for, or null when the
 * key is malformed. */
export function rankTargetKeyLabel(
  t: TFunction,
  rankTargetKey: string
): string | null {
  const target = describeRankTargetKey(rankTargetKey)
  if (!target) return null
  const rank = t(`ranks.${target.rank}`, {
    ns: "progression",
    defaultValue: target.rank,
  })
  return target.slots > 0 ? `${rank} (${target.slots}/6)` : rank
}

/**
 * The "this project already holds it" message for a slot conflict. A Rank conflict names the exact target
 * (distinct Rank targets coexist, so "already has a Rank goal" would be wrong); every other goal type
 * keeps the goal-type wording.
 */
export function projectConflictText(
  t: TFunction,
  projectName: string,
  goalTypes: GoalKind[],
  rankTargetKey?: string | null
): string {
  const target = rankTargetKey ? rankTargetKeyLabel(t, rankTargetKey) : null
  return target
    ? t("goals.project.membershipConflictRank", {
        project: projectName,
        target,
      })
    : t("goals.project.membershipConflict", {
        project: projectName,
        types: goalTypes
          .map((goalType) => t(`goals.create.goalTypes.${goalType}`))
          .join(", "),
      })
}
