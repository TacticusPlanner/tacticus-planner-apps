import {
  abilityCapByRarity,
  lastProgression,
  lastRank,
  maxAbilityLevel,
  progressionIndex,
  rankIndex,
  rarityOrder,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type { GoalKind } from "@/entities/goal"
import {
  rankTargetReached,
  type RankAdditionalTarget,
} from "@/features/goal-farming/@x/goal-planning"

/** The rarity ability caps (see `abilityCapByRarity` in `@workspace/game-domain`, which mirrors
 * the backend's `AbilityCaps` table) paired with their rarity tier, in rarity order — used to
 * label the Ability goal's target range with rarity-tier section headers and to map a target
 * level back to the tier that first permits it. */
export const abilityLevelsByRarity: readonly {
  rarity: Rarity
  level: number
}[] = rarityOrder.map((rarity) => ({
  rarity,
  level: abilityCapByRarity[rarity],
}))

// Rank is omitted entirely for a Mow (plan §16 phase 6) — Mows have no rank ladder, so offering the
// toggle would let a user attempt a goal type `useGoalPrerequisites`/`buildCombinedGoalSpecs` never
// handle for that entity. Unlock, by contrast, applies to both — a Mow's resource cost just isn't
// estimated yet (see `unlockResourceNeed`'s `isMow` short-circuit).
const CHARACTER_GOAL_KINDS: GoalKind[] = [
  "Unlock",
  "Ascension",
  "Ability",
  "Upgrade",
  "Rank",
]
const MOW_GOAL_KINDS: GoalKind[] = ["Unlock", "Ascension", "Ability", "Upgrade"]

/** The goal kinds the creation form offers for a unit of the given kind. */
export function goalKindsForEntity(
  entityType: "Character" | "Mow"
): GoalKind[] {
  return entityType === "Mow" ? MOW_GOAL_KINDS : CHARACTER_GOAL_KINDS
}

/** True once a unit has climbed its entire rank ladder — a Rank goal (and, for a Character, an
 * Upgrade goal's rank-range picker) has nowhere left to target. */
export function isAtMaxRank(currentRank: Rank | undefined): boolean {
  return !!currentRank && rankIndex(currentRank) >= rankIndex(lastRank)
}

/** True once a unit has reached the last Ascension step — an Ascension goal has nowhere left to
 * target. */
export function isAtMaxProgression(
  currentProgression: Progression | undefined
): boolean {
  return (
    !!currentProgression &&
    progressionIndex(currentProgression) >= progressionIndex(lastProgression)
  )
}

/** True once both ability tracks are at the highest ability level — an Ability goal has nowhere left
 * to target. A unit at its current rarity's cap is not maxed: a higher target is planned with an
 * auto-suggested Ascension, as V1 allowed goals past the rarity cap. */
export function isAtMaxAbility(
  currentActiveAbility: number,
  currentPassiveAbility: number
): boolean {
  return (
    currentActiveAbility >= maxAbilityLevel &&
    currentPassiveAbility >= maxAbilityLevel
  )
}

export type GoalValidationIssue =
  | "alreadyUnlocked"
  | "rankAlreadyReached"
  | "progressionAlreadyReached"
  | "abilityRange"
  | "abilityAlreadyReached"
  | "upgradeTargetsRequired"

/** One blocking problem of the creation form: the goal type whose card shows it, the control it sits under
 * (`target` for the type's target picker, `materials` for the Upgrade picker), and what is wrong. */
export type GoalFormIssue = {
  kind: GoalKind
  field: string
  issue: GoalValidationIssue
}

type GoalValidationParams = {
  hasEntityId: boolean
  enabledTypes: ReadonlySet<GoalKind>
  isOwned: boolean
  currentRank: Rank | undefined
  /** The slots of `currentRank` the character has already applied (empty when unknown). */
  currentAppliedSlots?: readonly number[]
  rankEnd: Rank
  /** The Rank target's partial slots past `rankEnd` (default `"None"`), so a same-rank target such
   *  as Diamond3 to Diamond3 + top row counts as above the current rank. */
  rankAdditionalTarget?: RankAdditionalTarget
  currentProgression: Progression | undefined
  progressionEnd: Progression
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  currentActiveAbility: number
  currentPassiveAbility: number
  upgradeFieldsValid: boolean
}

/** Every target-shape problem of the enabled goal types at once, in card order (`goalKindsForEntity`). */
export function getGoalValidationIssues(
  params: GoalValidationParams
): GoalFormIssue[] {
  if (!params.hasEntityId) return []
  const issues: GoalFormIssue[] = []
  const add = (kind: GoalKind, field: string, issue: GoalValidationIssue) =>
    issues.push({ kind, field, issue })
  if (params.enabledTypes.has("Unlock") && params.isOwned) {
    add("Unlock", "type", "alreadyUnlocked")
  }
  if (
    params.enabledTypes.has("Ascension") &&
    params.currentProgression &&
    progressionIndex(params.progressionEnd) <=
      progressionIndex(params.currentProgression)
  ) {
    add("Ascension", "target", "progressionAlreadyReached")
  }
  if (params.enabledTypes.has("Ability")) {
    const validRange =
      params.abilityActiveEnd >= params.abilityActiveStart &&
      params.abilityPassiveEnd >= params.abilityPassiveStart &&
      (params.abilityActiveEnd > params.abilityActiveStart ||
        params.abilityPassiveEnd > params.abilityPassiveStart)
    if (!validRange) add("Ability", "target", "abilityRange")
    else if (
      params.abilityActiveEnd <= params.currentActiveAbility &&
      params.abilityPassiveEnd <= params.currentPassiveAbility
    ) {
      add("Ability", "target", "abilityAlreadyReached")
    }
  }
  // An Upgrade goal is nothing without a target; per-row quantity problems are reported by the form.
  if (params.enabledTypes.has("Upgrade") && !params.upgradeFieldsValid) {
    add("Upgrade", "materials", "upgradeTargetsRequired")
  }
  if (
    params.enabledTypes.has("Rank") &&
    params.currentRank &&
    rankTargetReached(
      {
        rank: params.currentRank,
        appliedSlots: params.currentAppliedSlots ?? [],
      },
      params.rankEnd,
      params.rankAdditionalTarget ?? "None"
    )
  ) {
    add("Rank", "target", "rankAlreadyReached")
  }
  return issues
}

/** The first of {@link getGoalValidationIssues}, or null. */
export function getGoalValidationIssue(
  params: GoalValidationParams
): GoalValidationIssue | null {
  return getGoalValidationIssues(params)[0]?.issue ?? null
}
