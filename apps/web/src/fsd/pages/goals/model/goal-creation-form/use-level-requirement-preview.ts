import { useMemo } from "react"
import type { Rank } from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import {
  computeLevelGoalCost,
  requiredLevelForRankTarget,
  xpNeededForLevelRange,
  type LevelGoalCost,
  type RankAdditionalTarget,
} from "@/features/goal-farming"

/** What a Rank or Ability target needs in character level, previewed on that goal's own creation
 * card (integrate-level-progression-into-rank-goals) — never a goal or a prerequisite. */
export type LevelRequirementPreview = {
  requiredLevel: number
  currentLevel: number
  remainingXp: number
  /** Books still needed (and the gold to apply them) after netting owned XP books; `null` once the
   *  owned books already cover the gap. */
  cost: LevelGoalCost | null
}

export type LevelRequirementPreviews = Partial<
  Record<"Rank" | "Ability", LevelRequirementPreview>
>

function preview(
  requiredLevel: number,
  currentLevel: number,
  currentXp: number,
  ownedXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
): LevelRequirementPreview | undefined {
  if (requiredLevel <= currentLevel) return undefined
  return {
    requiredLevel,
    currentLevel,
    remainingXp: xpNeededForLevelRange(currentLevel, currentXp, requiredLevel),
    cost: computeLevelGoalCost({
      currentLevel,
      currentXp,
      targetLevel: requiredLevel,
      ownedXpBooks,
    }),
  }
}

/**
 * The level requirement of the enabled Rank and Ability targets — Character-only (a Mow's `xpLevel` is
 * never targeted). A locked character has no synced level, so a freshly-unlocked unit's level 1 and no
 * XP are assumed, the same conservative posture as the Ascension suggestion.
 */
export function useLevelRequirementPreviews({
  entityType,
  enabledTypes,
  rankEnd,
  rankAdditionalTarget,
  abilityActiveEnd,
  abilityPassiveEnd,
  currentLevel,
  currentXp,
  inventoryXpBooks,
}: {
  entityType: "Character" | "Mow"
  enabledTypes: ReadonlySet<GoalKind>
  rankEnd: Rank
  rankAdditionalTarget: RankAdditionalTarget
  abilityActiveEnd: number
  abilityPassiveEnd: number
  currentLevel: number | undefined
  currentXp: number | undefined
  inventoryXpBooks: readonly { xpBookId: string; amount: number }[] | undefined
}): LevelRequirementPreviews {
  return useMemo(() => {
    if (entityType !== "Character") return {}
    const level = currentLevel ?? 1
    const xp = currentXp ?? 0
    return {
      Rank: enabledTypes.has("Rank")
        ? preview(
            requiredLevelForRankTarget(rankEnd, rankAdditionalTarget),
            level,
            xp,
            inventoryXpBooks
          )
        : undefined,
      Ability: enabledTypes.has("Ability")
        ? preview(
            Math.max(abilityActiveEnd, abilityPassiveEnd),
            level,
            xp,
            inventoryXpBooks
          )
        : undefined,
    }
  }, [
    entityType,
    enabledTypes,
    rankEnd,
    rankAdditionalTarget,
    abilityActiveEnd,
    abilityPassiveEnd,
    currentLevel,
    currentXp,
    inventoryXpBooks,
  ])
}
