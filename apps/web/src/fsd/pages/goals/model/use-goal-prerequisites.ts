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

type AscensionSuggestion = { start: Progression; end: Progression }

export type GoalPrerequisites = {
  /** The selected character isn't in the caller's synced roster (locked/not yet owned) and at least
   *  one enabled goal type needs it unlocked first. */
  needsUnlock: boolean
  /** The enabled Rank goal's target isn't reachable at the effective current progression, and
   *  Ascension wasn't already toggled to cover it — `null` otherwise. */
  needsAscension: AscensionSuggestion | null
}

const TYPES_REQUIRING_UNLOCK: ReadonlySet<GoalKind> = new Set([
  "Rank",
  "Ascension",
  "Ability",
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
  isLocked,
  currentProgression,
  enabledTypes,
  rankEnd,
}: {
  /** Whether the selected character is absent from the caller's synced roster. */
  isLocked: boolean
  /** The character's current progression, when known (unavailable while locked). */
  currentProgression: Progression | undefined
  enabledTypes: ReadonlySet<GoalKind>
  rankEnd: Rank
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

  return { needsUnlock, needsAscension }
}
