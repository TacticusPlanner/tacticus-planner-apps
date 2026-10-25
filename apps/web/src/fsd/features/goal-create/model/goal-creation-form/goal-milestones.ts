import {
  lastProgression,
  lastRank,
  maxAbilityLevel,
  minProgressionForAbilityLevel,
  minProgressionForRank,
  progressionIndex,
  progressionOrder,
  rankAt,
  rankIndex,
  type Progression,
  type Rank,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"

// Ladder creation (goal-target-milestones): the Rank, Ascension and Ability cards' own fields are the
// first milestone; these are the extra end targets appended with "Add milestone". Each must be above
// the one before it, and the submission sends one spec per milestone in this order.

export type AbilityMilestone = { activeEnd: number; passiveEnd: number }

export type GoalMilestones = {
  rank: Rank[]
  ascension: Progression[]
  ability: AbilityMilestone[]
}

export type MilestoneKind = "Rank" | "Ascension" | "Ability"

export const EMPTY_MILESTONES: GoalMilestones = {
  rank: [],
  ascension: [],
  ability: [],
}

/** The default target of a newly added Rank milestone: the next rank above the previous one. */
export function nextRankMilestone(previous: Rank): Rank {
  return rankAt(Math.min(rankIndex(previous) + 1, rankIndex(lastRank)))
}

/** The default target of a newly added Ascension milestone: the next step above the previous one. */
export function nextProgressionMilestone(previous: Progression): Progression {
  return progressionOrder[progressionIndex(previous) + 1] ?? lastProgression
}

/** The default target of a newly added Ability milestone: one level above the previous on each track. */
export function nextAbilityMilestone(
  previous: AbilityMilestone
): AbilityMilestone {
  return {
    activeEnd: Math.min(previous.activeEnd + 1, maxAbilityLevel),
    passiveEnd: Math.min(previous.passiveEnd + 1, maxAbilityLevel),
  }
}

/** Whether `next` is above `previous`: no track lower, and at least one higher. */
export function abilityMilestoneAbove(
  previous: AbilityMilestone,
  next: AbilityMilestone
): boolean {
  return (
    next.activeEnd >= previous.activeEnd &&
    next.passiveEnd >= previous.passiveEnd &&
    (next.activeEnd > previous.activeEnd ||
      next.passiveEnd > previous.passiveEnd)
  )
}

/** Whether another milestone can still be added after `last` (it isn't already at the ceiling). */
export function canAddMilestone(
  kind: MilestoneKind,
  last: { rank: Rank; progression: Progression; ability: AbilityMilestone }
): boolean {
  switch (kind) {
    case "Rank":
      return rankIndex(last.rank) < rankIndex(lastRank)
    case "Ascension":
      return (
        progressionIndex(last.progression) < progressionIndex(lastProgression)
      )
    case "Ability":
      return (
        last.ability.activeEnd < maxAbilityLevel ||
        last.ability.passiveEnd < maxAbilityLevel
      )
  }
}

/**
 * The first milestone (in card order Rank, Ascension, Ability) whose target is not above the one
 * before it, as `{ kind, index }` into that kind's extra milestones, or null when every enabled ladder
 * strictly increases. A disabled type's milestones are ignored (they are not submitted).
 */
export function milestoneOrderIssue(params: {
  enabledTypes: ReadonlySet<GoalKind>
  rankEnd: Rank
  progressionEnd: Progression
  ability: AbilityMilestone
  milestones: GoalMilestones
}): { kind: MilestoneKind; index: number } | null {
  const { enabledTypes, milestones } = params
  if (enabledTypes.has("Rank")) {
    const index = firstNotAbove(
      [params.rankEnd, ...milestones.rank],
      (previous, next) => rankIndex(next) > rankIndex(previous)
    )
    if (index !== null) return { kind: "Rank", index }
  }
  if (enabledTypes.has("Ascension")) {
    const index = firstNotAbove(
      [params.progressionEnd, ...milestones.ascension],
      (previous, next) => progressionIndex(next) > progressionIndex(previous)
    )
    if (index !== null) return { kind: "Ascension", index }
  }
  if (enabledTypes.has("Ability")) {
    const index = firstNotAbove(
      [params.ability, ...milestones.ability],
      abilityMilestoneAbove
    )
    if (index !== null) return { kind: "Ability", index }
  }
  return null
}

/** Index into the extra milestones (the list minus its first entry) of the first non-increasing one. */
function firstNotAbove<T>(
  ladder: readonly T[],
  above: (previous: T, next: T) => boolean
): number | null {
  for (let index = 1; index < ladder.length; index++) {
    if (!above(ladder[index - 1] as T, ladder[index] as T)) return index - 1
  }
  return null
}

/** The progression a Rank target needs, or null when `base` already permits it. */
export function rankProgressionNeed(
  rank: Rank,
  base: Progression
): Progression | null {
  const need = minProgressionForRank(rank)
  return progressionIndex(need) > progressionIndex(base) ? need : null
}

/** The progression an Ability target needs (its higher track), or null when `base` already permits it. */
export function abilityProgressionNeed(
  ability: AbilityMilestone,
  base: Progression
): Progression | null {
  const level = Math.max(ability.activeEnd, ability.passiveEnd)
  if (level <= 0) return null
  const need = minProgressionForAbilityLevel(level)
  return progressionIndex(need) > progressionIndex(base) ? need : null
}

/** The highest of `needs`, or null when there are none. */
export function highestProgression(
  needs: readonly (Progression | null)[]
): Progression | null {
  let highest: Progression | null = null
  for (const need of needs) {
    if (
      need !== null &&
      (highest === null || progressionIndex(need) > progressionIndex(highest))
    ) {
      highest = need
    }
  }
  return highest
}

/** The lowest-ending of `ascensions` that reaches `need`, or undefined when none does. */
export function lowestCoveringAscension<T extends { end: Progression }>(
  ascensions: readonly T[],
  need: Progression
): T | undefined {
  let best: T | undefined
  for (const ascension of ascensions) {
    if (progressionIndex(ascension.end) < progressionIndex(need)) continue
    if (!best || progressionIndex(ascension.end) < progressionIndex(best.end)) {
      best = ascension
    }
  }
  return best
}
