import type { Progression, Rank, UpgradeId } from "@workspace/game-domain"
import { rankIndex } from "@workspace/game-domain"

import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  rankUpUpgradeIds,
  type Character,
  type UpgradeWithFarmLocations,
} from "@/features/rank-lookup"
import type {
  CombinedGoalSpec,
  AscensionFarmingSource,
  FarmingStrategy,
  GoalKind,
} from "@/entities/goal"

// Pure helpers behind the combined-creation composer (plan §6/§7) — split out of
// `use-create-goal-form.ts` purely to keep that file under this repo's max-lines rule; all plain
// functions (no hooks), so they're directly unit-testable without rendering anything.

// Deliberately not reusing goal-type-fields.tsx's own `MissingUpgrade` type name (id: string) to
// avoid two same-named-but-different exported types — this one's `id` stays branded `UpgradeId`,
// which is structurally assignable to that string-keyed prop type at the call site.
export type MissingUpgradeEntry = {
  id: UpgradeId
  label: string
  missing: number
  required: number
  inventoryContribution: number
}

/** Resource-requirement preview (Rank goals only, plan §16 phase 2 scope decision — Ascension/
 * Ability/Unlock have no analogous "required vs owned" calc reused anywhere yet): the base
 * upgrades still needed for `rankStart` -> `rankEnd`, net of what's already applied/owned. `[]`
 * when Rank isn't enabled or the range is empty/invalid. */
export function computeMissingUpgrades(params: {
  rankEnabled: boolean
  character: Character | undefined
  rankStart: Rank
  rankEnd: Rank
  rankEndPointFive: boolean
  playerCharacter:
    { rank: Rank; appliedUpgradeSlots: readonly number[] } | undefined
  inventoryUpgrades:
    readonly { upgradeId: UpgradeId; amount: number }[] | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  includeCovered?: boolean
}): MissingUpgradeEntry[] {
  const {
    rankEnabled,
    character,
    rankStart,
    rankEnd,
    rankEndPointFive,
    playerCharacter,
    upgradesById,
  } = params
  if (
    !rankEnabled ||
    !character ||
    rankIndex(rankStart) >= rankIndex(rankEnd)
  ) {
    return []
  }

  const requiredIds = rankUpUpgradeIds(
    character,
    rankStart,
    rankEnd,
    rankEndPointFive
  )
  const required = aggregateBaseUpgrades(requiredIds, upgradesById)

  const appliedIds = playerCharacter
    ? appliedUpgradeIds(
        character,
        playerCharacter.rank,
        playerCharacter.appliedUpgradeSlots
      )
    : []
  const owned = aggregateOwnedBaseUpgrades(
    appliedIds,
    (params.inventoryUpgrades ?? []).map((entry) => ({
      id: entry.upgradeId,
      amount: entry.amount,
    })),
    upgradesById
  )
  const ownedById = new Map(owned.map((entry) => [entry.id, entry.count]))

  return required
    .map((need) => {
      const contribution = Math.min(need.count, ownedById.get(need.id) ?? 0)
      return {
        id: need.id,
        label: upgradesById.get(need.id)?.label ?? need.id,
        missing: need.count - contribution,
        required: need.count,
        inventoryContribution: contribution,
      }
    })
    .filter((entry) => params.includeCovered || entry.missing > 0)
}

export type ReviewItem = { goalType: GoalKind; autoSuggested: boolean }

/** "What will be created" review list, in submit order, flagging entries the user didn't
 * explicitly toggle themselves (auto-included via `useGoalPrerequisites`'s suggestions). */
export function buildReviewItems(
  enabledTypes: ReadonlySet<GoalKind>,
  includesUnlock: boolean,
  includesAscension: boolean
): ReviewItem[] {
  const items: ReviewItem[] = []
  if (includesUnlock) {
    items.push({
      goalType: "Unlock",
      autoSuggested: !enabledTypes.has("Unlock"),
    })
  }
  if (includesAscension) {
    items.push({
      goalType: "Ascension",
      autoSuggested: !enabledTypes.has("Ascension"),
    })
  }
  for (const kind of ["Rank", "Ability"] as const) {
    if (enabledTypes.has(kind)) {
      items.push({ goalType: kind, autoSuggested: false })
    }
  }
  return items
}

/**
 * The ordered spec list to submit: Unlock -> Ascension -> Rank -> Ability.
 * Rank/Ability depend on whichever of Unlock/Ascension precede them; Ascension depends on Unlock
 * alone. `ascensionSuggestion` is `useGoalPrerequisites`'s auto-suggested target, used only when
 * Ascension itself wasn't explicitly toggled.
 */
export function buildCombinedGoalSpecs(params: {
  enabledTypes: ReadonlySet<GoalKind>
  includesUnlock: boolean
  includesAscension: boolean
  ascensionSuggestion: { start: Progression; end: Progression } | null
  rankStart: Rank
  rankEnd: Rank
  rankStartPointFive: boolean
  rankEndPointFive: boolean
  progressionStart: Progression
  progressionEnd: Progression
  ascensionFarmingSource: AscensionFarmingSource
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  abilityTrack: "first" | "second"
  farmingStrategy: FarmingStrategy
}): CombinedGoalSpec[] {
  const { enabledTypes, includesUnlock, includesAscension } = params
  const specs: CombinedGoalSpec[] = []
  let unlockIndex: number | null = null
  let ascensionIndex: number | null = null

  if (includesUnlock) {
    specs.push({ goalType: "Unlock", config: {}, dependsOnIndex: [] })
    unlockIndex = specs.length - 1
  }

  if (includesAscension) {
    const ascension = enabledTypes.has("Ascension")
      ? { start: params.progressionStart, end: params.progressionEnd }
      : params.ascensionSuggestion!
    specs.push({
      goalType: "Ascension",
      config: {
        progression: ascension,
        ascensionFarming: {
          source: params.ascensionFarmingSource,
          shardBattleIds: [],
          mythicShardBattleIds: [],
        },
      },
      dependsOnIndex: unlockIndex === null ? [] : [unlockIndex],
    })
    ascensionIndex = specs.length - 1
  }

  if (enabledTypes.has("Rank")) {
    specs.push({
      goalType: "Rank",
      config: {
        farmingStrategy: params.farmingStrategy,
        rank: {
          start: rankIndex(params.rankStart),
          startPointFive: params.rankStartPointFive,
          startAppliedUpgrades: 0,
          end: rankIndex(params.rankEnd),
          endPointFive: params.rankEndPointFive,
          endAppliedUpgrades: 0,
        },
      },
      dependsOnIndex: [unlockIndex, ascensionIndex].filter(
        (index): index is number => index !== null
      ),
    })
  }

  if (enabledTypes.has("Ability")) {
    specs.push({
      goalType: "Ability",
      config: {
        farmingStrategy: params.farmingStrategy,
        ability: {
          activeStart: params.abilityActiveStart,
          activeEnd:
            params.abilityTrack === "first"
              ? params.abilityActiveEnd
              : params.abilityActiveStart,
          passiveStart: params.abilityPassiveStart,
          passiveEnd:
            params.abilityTrack === "second"
              ? params.abilityPassiveEnd
              : params.abilityPassiveStart,
        },
      },
      dependsOnIndex: unlockIndex === null ? [] : [unlockIndex],
    })
  }

  return specs
}
