import { useMemo } from "react"
import {
  firstProgression,
  progressionIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"

import {
  abilityProgressionNeed,
  EMPTY_MILESTONES,
  highestProgression,
  lowestCoveringAscension,
  rankProgressionNeed,
  type GoalMilestones,
} from "./goal-milestones"

/** An in-flight Ascension goal of the selected unit. */
export type ExistingAscension = { goalId: string; end: Progression }

type AscensionSuggestion = { start: Progression; end: Progression }

export type GoalPrerequisites = {
  /** The selected character isn't in the caller's synced roster (locked/not yet owned) and at least
   *  one enabled goal type needs it unlocked first. */
  needsUnlock: boolean
  /** The enabled Rank goal's target isn't reachable at the effective current progression, and
   *  Ascension wasn't already toggled to cover it — `null` otherwise. */
  needsAscension: AscensionSuggestion | null
  /** The in-flight Ascension goal the highest enabled target will depend on instead of a new
   *  Ascension (the lowest one that reaches it), or null when none does or none is needed. */
  coveringAscension: ExistingAscension | null
  /** The progression the targets are reasoned from: current, else where the Unlock lands. */
  baseProgression: Progression
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
  unlockProgression,
  enabledTypes,
  rankEnd,
  abilityActiveEnd,
  abilityPassiveEnd,
  milestones = EMPTY_MILESTONES,
  existingAscensions = NO_ASCENSIONS,
}: {
  /** Whether the selected character is absent from the caller's synced roster. */
  isLocked: boolean
  /** The character's current progression, when known (unavailable while locked). */
  currentProgression: Progression | undefined
  /** Where a locked character lands once its Unlock goal completes (its starting rarity's first
   *  step), when known. */
  unlockProgression?: Progression
  enabledTypes: ReadonlySet<GoalKind>
  rankEnd: Rank
  abilityActiveEnd: number
  abilityPassiveEnd: number
  /** The extra ladder targets ("Add milestone") of each enabled type. */
  milestones?: GoalMilestones
  /** The unit's in-flight Ascension goals: one reaching the need replaces the suggestion. */
  existingAscensions?: readonly ExistingAscension[]
}): GoalPrerequisites {
  const needsUnlock =
    isLocked &&
    !enabledTypes.has("Unlock") &&
    [...enabledTypes].some((kind) => TYPES_REQUIRING_UNLOCK.has(kind))

  // A locked character has no synced progression: unlocking puts it at its starting rarity, so reason
  // from there. Falling back to the lowest step would suggest an Ascension the Unlock already covers
  // (e.g. Common -> Epic for an Epic character). Only when the starting rarity is unknown do we assume
  // the lowest possible point.
  const baseProgression =
    currentProgression ?? unlockProgression ?? firstProgression

  const ascension = useMemo(() => {
    const none = { needsAscension: null, coveringAscension: null }
    if (enabledTypes.has("Ascension")) return none

    // The lowest progression each enabled target needs: a Rank target needs a rarity that permits that
    // rank; an Ability target needs a rarity whose ability cap covers the higher of the two tracks.
    // Every milestone counts, and whichever demands most wins.
    const end = highestProgression([
      ...(enabledTypes.has("Rank")
        ? [rankEnd, ...milestones.rank].map((rank) =>
            rankProgressionNeed(rank, baseProgression)
          )
        : []),
      ...(enabledTypes.has("Ability")
        ? [
            { activeEnd: abilityActiveEnd, passiveEnd: abilityPassiveEnd },
            ...milestones.ability,
          ].map((ability) => abilityProgressionNeed(ability, baseProgression))
        : []),
    ])
    if (
      end === null ||
      progressionIndex(end) <= progressionIndex(baseProgression)
    ) {
      return none
    }

    // An in-flight Ascension goal that already reaches the need is depended on instead; a lower one
    // doesn't block suggesting a new one (it stays a separate milestone).
    const covering = lowestCoveringAscension(existingAscensions, end)
    if (covering) return { needsAscension: null, coveringAscension: covering }
    return {
      needsAscension: { start: baseProgression, end },
      coveringAscension: null,
    }
  }, [
    enabledTypes,
    rankEnd,
    baseProgression,
    abilityActiveEnd,
    abilityPassiveEnd,
    milestones,
    existingAscensions,
  ])

  return { needsUnlock, ...ascension, baseProgression }
}

const NO_ASCENSIONS: readonly ExistingAscension[] = []
