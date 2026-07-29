import { useMemo } from "react"
import {
  firstProgression,
  maxRankForProgression,
  minProgressionForRank,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"

import {
  requiredLevelForRankTarget,
  type RankAdditionalTarget,
} from "../estimate/rank-additional-target"

type AscensionSuggestion = { start: Progression; end: Progression }
type LevelSuggestion = { start: number; end: number }

export type GoalPrerequisites = {
  /** The selected character isn't in the caller's synced roster (locked/not yet owned) and at least
   *  one enabled goal type needs it unlocked first. */
  needsUnlock: boolean
  /** The enabled Rank goal's target isn't reachable at the effective current progression, and
   *  Ascension wasn't already toggled to cover it — `null` otherwise. */
  needsAscension: AscensionSuggestion | null
  /** The enabled Rank and/or Ability goal's target implies a character level beyond the effective
   *  current level, and Level wasn't already toggled to cover it — `null` otherwise (and always
   *  `null` for a Mow, which has no Level goal — plan scope decision). */
  needsLevel: LevelSuggestion | null
}

const TYPES_REQUIRING_UNLOCK: ReadonlySet<GoalKind> = new Set([
  "Rank",
  "Ascension",
  "Ability",
  "Upgrade",
])

/**
 * Detects the two prerequisite gaps the combined-creation composer (plan §6) auto-suggests: a locked
 * character needs an Unlock goal before Rank/Ascension/Ability can make sense, and a Rank target beyond
 * what the character's current Ascension progression allows needs an Ascension goal first.
 *
 * Detection stays this simple by design (plan §16 phase 4/5 scope notes): there's no ability-level
 * rank-gating data anywhere in the domain model, so ability gaps are never detected — only locked-entity
 * and rank-reachability are.
 */
export function useGoalPrerequisites({
  entityType,
  isLocked,
  currentProgression,
  currentLevel,
  enabledTypes,
  rankEnd,
  rankAdditionalTarget,
  abilityActiveEnd,
  abilityPassiveEnd,
}: {
  entityType: "Character" | "Mow"
  /** Whether the selected character is absent from the caller's synced roster. */
  isLocked: boolean
  /** The character's current progression, when known (unavailable while locked). */
  currentProgression: Progression | undefined
  /** The unit's current synced level, when known (unavailable while locked). */
  currentLevel: number | undefined
  enabledTypes: ReadonlySet<GoalKind>
  rankEnd: Rank
  rankAdditionalTarget: RankAdditionalTarget
  abilityActiveEnd: number
  abilityPassiveEnd: number
}): GoalPrerequisites {
  const needsUnlock =
    isLocked &&
    !enabledTypes.has("Unlock") &&
    [...enabledTypes].some((kind) => TYPES_REQUIRING_UNLOCK.has(kind))

  const needsAscension = useMemo<AscensionSuggestion | null>(() => {
    if (!enabledTypes.has("Rank") || enabledTypes.has("Ascension")) {
      return null
    }

    // A locked character has no synced progression to reason from — conservatively assume the
    // lowest possible starting point, since a freshly-unlocked unit starts there.
    const start = currentProgression ?? firstProgression
    if (rankIndex(rankEnd) <= rankIndex(maxRankForProgression(start))) {
      return null
    }

    return { start, end: minProgressionForRank(rankEnd) }
  }, [enabledTypes, rankEnd, currentProgression])

  // Ranking up (and applying each upgrade slot beyond a clean rank boundary) and leveling an
  // ability both require having already reached a specific character level — Ability's own target
  // level directly *is* the required character level (they share the same numeric scale; compare
  // `abilityCapByRarity` in goal-validation.ts against `rankToLevel` in rank-additional-target.ts,
  // which land on the same figures per rarity tier).
  const needsLevel = useMemo<LevelSuggestion | null>(() => {
    if (entityType !== "Character" || enabledTypes.has("Level")) return null

    let required = 0
    if (enabledTypes.has("Rank")) {
      required = Math.max(
        required,
        requiredLevelForRankTarget(rankEnd, rankAdditionalTarget)
      )
    }
    if (enabledTypes.has("Ability")) {
      required = Math.max(required, abilityActiveEnd, abilityPassiveEnd)
    }
    if (required <= 0) return null

    // A locked character has no synced level to reason from — conservatively assume the lowest
    // possible starting point, since a freshly-unlocked unit starts there (same posture as
    // needsAscension's own `firstProgression` fallback above).
    const start = currentLevel ?? 1
    if (required <= start) return null

    return { start, end: required }
  }, [
    entityType,
    enabledTypes,
    rankEnd,
    rankAdditionalTarget,
    abilityActiveEnd,
    abilityPassiveEnd,
    currentLevel,
  ])

  return { needsUnlock, needsAscension, needsLevel }
}
