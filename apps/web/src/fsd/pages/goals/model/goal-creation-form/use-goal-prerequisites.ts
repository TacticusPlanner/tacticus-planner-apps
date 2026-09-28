import { useMemo } from "react"
import {
  firstProgression,
  minProgressionForAbilityLevel,
  minProgressionForRank,
  progressionIndex,
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
  "Upgrade",
])

/**
 * Detects the prerequisite gaps the combined-creation composer (plan §6) auto-suggests: a locked
 * character needs an Unlock goal before Rank/Ascension/Ability can make sense; a Rank *or* Ability
 * target beyond what the character's current Ascension progression allows needs an Ascension goal
 * first. The Ability rarity ceiling (`minProgressionForAbilityLevel`) is handled the same way a
 * too-high Rank target is. The character level a target implies is never a prerequisite goal — it is
 * shown on the goal itself (`use-level-requirement-preview.ts`).
 */
export function useGoalPrerequisites({
  isLocked,
  currentProgression,
  enabledTypes,
  rankEnd,
  abilityActiveEnd,
  abilityPassiveEnd,
}: {
  /** Whether the selected character is absent from the caller's synced roster. */
  isLocked: boolean
  /** The character's current progression, when known (unavailable while locked). */
  currentProgression: Progression | undefined
  enabledTypes: ReadonlySet<GoalKind>
  rankEnd: Rank
  abilityActiveEnd: number
  abilityPassiveEnd: number
}): GoalPrerequisites {
  const needsUnlock =
    isLocked &&
    !enabledTypes.has("Unlock") &&
    [...enabledTypes].some((kind) => TYPES_REQUIRING_UNLOCK.has(kind))

  const needsAscension = useMemo<AscensionSuggestion | null>(() => {
    if (enabledTypes.has("Ascension")) return null

    // A locked character has no synced progression to reason from — conservatively assume the
    // lowest possible starting point, since a freshly-unlocked unit starts there.
    const start = currentProgression ?? firstProgression

    // The lowest progression each enabled target needs: a Rank target needs a rarity that permits
    // that rank; an Ability target needs a rarity whose ability cap covers the higher of the two
    // tracks. Whichever demands more wins.
    const required: Progression[] = []
    if (enabledTypes.has("Rank")) {
      required.push(minProgressionForRank(rankEnd))
    }
    if (enabledTypes.has("Ability")) {
      const abilityTarget = Math.max(abilityActiveEnd, abilityPassiveEnd)
      if (abilityTarget > 0) {
        required.push(minProgressionForAbilityLevel(abilityTarget))
      }
    }
    if (required.length === 0) return null

    const end = required.reduce((highest, candidate) =>
      progressionIndex(candidate) > progressionIndex(highest)
        ? candidate
        : highest
    )
    if (progressionIndex(end) <= progressionIndex(start)) return null

    return { start, end }
  }, [
    enabledTypes,
    rankEnd,
    currentProgression,
    abilityActiveEnd,
    abilityPassiveEnd,
  ])

  return { needsUnlock, needsAscension }
}
