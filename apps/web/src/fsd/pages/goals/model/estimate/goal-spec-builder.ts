import type { Progression, Rank, UpgradeId } from "@workspace/game-domain"
import { rankIndex } from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

import {
  aggregateBaseUpgradeAmounts,
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
  rankEndAppliedUpgrades?: number
  rankEndTopRowCount?: number
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
  const sameRankWithoutPartial =
    rankIndex(rankStart) === rankIndex(rankEnd) &&
    !rankEndPointFive &&
    (params.rankEndAppliedUpgrades ?? 0) === 0 &&
    (params.rankEndTopRowCount ?? 0) === 0
  if (
    !rankEnabled ||
    !character ||
    rankIndex(rankStart) > rankIndex(rankEnd) ||
    sameRankWithoutPartial
  ) {
    return []
  }

  const requiredIds = rankUpUpgradeIds(
    character,
    rankStart,
    rankEnd,
    rankEndPointFive,
    params.rankEndAppliedUpgrades,
    params.rankEndTopRowCount
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

/** The upgrade ids relevant to a Character's own progression — its whole rank ladder — used to
 * bound what an Upgrade goal on that character may target. Mirrors the backend's
 * `CharacterRelevantUpgradeIds` (`GameCatalogGoalLookups.cs`) so client-side filtering and
 * server-side rejection agree. */
export function characterRelevantUpgradeIds(
  character: Character
): ReadonlySet<UpgradeId> {
  return new Set(character.rankUpUpgrades.flatMap((step) => step.upgradeIds))
}

/** The upgrade ids relevant to a Mow's own progression — its whole primary+secondary ability
 * ladder. Mirrors the backend's `MowRelevantUpgradeIds`. */
export function mowRelevantUpgradeIds(
  mow: MowStorageModel
): ReadonlySet<UpgradeId> {
  return new Set([
    ...mow.primaryAbility.recipes.flat(),
    ...mow.secondaryAbility.recipes.flat(),
  ])
}

function countOccurrences(
  ids: UpgradeId[],
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
): Map<UpgradeId, number> {
  const counts = new Map<UpgradeId, number>()
  for (const id of ids) {
    // An Upgrade goal only ever targets base upgrades — a crafted upgrade isn't something you farm
    // directly, so it's never offered as a selectable target (its own base ingredients still are,
    // wherever they themselves show up in the ladder/recipes).
    if (upgradesById.get(id)?.crafted) continue
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

/** An Upgrade goal's selectable upgrades, scoped to `rankStart` -> `rankEnd` (plan: the rank-range
 * picker on the Upgrade card) — each key is a selectable (base, non-crafted) upgrade id, each value
 * the number of times it's actually required across that specific range (the raw applied-upgrade
 * count, i.e. what the picker prefills as the target quantity). Empty for an empty/invalid range. */
export function characterRelevantUpgradeQuantities(
  character: Character,
  rankStart: Rank,
  rankEnd: Rank,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
): Map<UpgradeId, number> {
  return countOccurrences(
    rankUpUpgradeIds(character, rankStart, rankEnd, false),
    upgradesById
  )
}

/** Same shape as `characterRelevantUpgradeQuantities`, but for a Mow's whole ability ladder (both
 * tracks combined) — a Mow's Upgrade goal isn't scoped to a level range (unlike a Character's rank
 * range), since a single level range can't unambiguously cover two independent ability tracks. */
export function mowRelevantUpgradeQuantities(
  mow: MowStorageModel,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
): Map<UpgradeId, number> {
  return countOccurrences(
    [
      ...mow.primaryAbility.recipes.flat(),
      ...mow.secondaryAbility.recipes.flat(),
    ],
    upgradesById
  )
}

/** Resource-requirement preview for an Upgrade goal (plan: re-introduced V1 upgrade-stockpile
 * goal, phase 9+) — reduces every target to base upgrades via the same `aggregateBaseUpgrades`/
 * `aggregateOwnedBaseUpgrades` primitives Rank goals use (see `computeMissingUpgrades` above),
 * netted against inventory only. Unlike a Rank goal there's no "applied to a rank" contribution to
 * net against — an Upgrade goal isn't attached to any specific rank transition, just a standalone
 * upgrade stockpile target. */
export function computeUpgradeGoalNeed(params: {
  upgradeEnabled: boolean
  targets: { upgradeId: UpgradeId; quantity: number }[]
  inventoryUpgrades:
    readonly { upgradeId: UpgradeId; amount: number }[] | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  includeCovered?: boolean
}): MissingUpgradeEntry[] {
  const { upgradeEnabled, targets, upgradesById } = params
  if (!upgradeEnabled || targets.length === 0) return []

  const required = aggregateBaseUpgradeAmounts(
    targets.map((target) => ({
      id: target.upgradeId,
      amount: target.quantity,
    })),
    upgradesById
  )
  const owned = aggregateOwnedBaseUpgrades(
    [],
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
  includesAscension: boolean,
  includesLevel: boolean
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
  if (includesLevel) {
    items.push({
      goalType: "Level",
      autoSuggested: !enabledTypes.has("Level"),
    })
  }
  for (const kind of ["Rank", "Ability", "Upgrade"] as const) {
    if (enabledTypes.has(kind)) {
      items.push({ goalType: kind, autoSuggested: false })
    }
  }
  return items
}

/**
 * The ordered spec list to submit: Unlock -> Ascension -> Level -> Rank -> Ability. Rank/Ability
 * depend on whichever of Unlock/Ascension/Level precede them (a Level goal is itself a prerequisite
 * for both, not a sibling — you can't reach a rank/ability level beyond your current character
 * level, see use-goal-prerequisites.ts); Ascension/Level each depend on Unlock alone.
 * `ascensionSuggestion`/`levelSuggestion` are `useGoalPrerequisites`'s auto-suggested targets, used
 * only when Ascension/Level themselves weren't explicitly toggled.
 */
export function buildCombinedGoalSpecs(params: {
  enabledTypes: ReadonlySet<GoalKind>
  includesUnlock: boolean
  includesAscension: boolean
  includesLevel: boolean
  ascensionSuggestion: { start: Progression; end: Progression } | null
  levelSuggestion: { start: number; end: number } | null
  rankStart: Rank
  rankEnd: Rank
  rankEndPointFive: boolean
  rankEndAppliedUpgrades: number
  progressionStart: Progression
  progressionEnd: Progression
  ascensionFarmingSource: AscensionFarmingSource
  abilityActiveStart: number
  abilityActiveEnd: number
  abilityPassiveStart: number
  abilityPassiveEnd: number
  levelStart: number
  levelEnd: number
  farmingStrategy: FarmingStrategy
  upgradeTargets: { upgradeId: UpgradeId; quantity: number }[]
  /** The shard-location selector's checked battle ids (plan: Unlock/Ascension shard-location
   * picker), pre-split by shard type (a battle id is unambiguously one or the other, per the
   * catalog's own `isMythic` tag — see use-shard-location-selection.ts) — empty means unrestricted
   * for that type, so the specs below omit/empty that field rather than pinning it, identical to
   * today's behavior before this selector existed. Unlock only ever uses the regular set (it never
   * costs mythic shards); Ascension routes regular selections to `shardBattleIds` and mythic ones to
   * `mythicShardBattleIds`. */
  selectedRegularShardLocationIds: readonly string[]
  selectedMythicShardLocationIds: readonly string[]
}): CombinedGoalSpec[] {
  const { enabledTypes, includesUnlock, includesAscension, includesLevel } =
    params
  const specs: CombinedGoalSpec[] = []
  let unlockIndex: number | null = null
  let ascensionIndex: number | null = null
  let levelIndex: number | null = null

  if (includesUnlock) {
    specs.push({
      goalType: "Unlock",
      config: {
        farmingLocationIds:
          params.selectedRegularShardLocationIds.length > 0
            ? [...params.selectedRegularShardLocationIds]
            : undefined,
      },
      dependsOnIndex: [],
    })
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
          shardBattleIds: [...params.selectedRegularShardLocationIds],
          mythicShardBattleIds: [...params.selectedMythicShardLocationIds],
        },
      },
      dependsOnIndex: unlockIndex === null ? [] : [unlockIndex],
    })
    ascensionIndex = specs.length - 1
  }

  if (includesLevel) {
    const level = enabledTypes.has("Level")
      ? { start: params.levelStart, end: params.levelEnd }
      : params.levelSuggestion!
    specs.push({
      goalType: "Level",
      config: { level },
      dependsOnIndex: unlockIndex === null ? [] : [unlockIndex],
    })
    levelIndex = specs.length - 1
  }

  if (enabledTypes.has("Rank")) {
    specs.push({
      goalType: "Rank",
      config: {
        farmingStrategy: params.farmingStrategy,
        rank: {
          start: rankIndex(params.rankStart),
          // The "From" field is always a clean rank boundary (read-only, synced from the unit's
          // actual current rank) — only the target end carries an Additional target.
          startPointFive: false,
          startAppliedUpgrades: 0,
          end: rankIndex(params.rankEnd),
          endPointFive: params.rankEndPointFive,
          endAppliedUpgrades: params.rankEndAppliedUpgrades,
        },
      },
      dependsOnIndex: [unlockIndex, ascensionIndex, levelIndex].filter(
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
          activeEnd: params.abilityActiveEnd,
          passiveStart: params.abilityPassiveStart,
          passiveEnd: params.abilityPassiveEnd,
        },
      },
      dependsOnIndex: [unlockIndex, levelIndex].filter(
        (index): index is number => index !== null
      ),
    })
  }

  if (enabledTypes.has("Upgrade") && params.upgradeTargets.length > 0) {
    specs.push({
      goalType: "Upgrade",
      config: {
        upgrade: { targets: params.upgradeTargets },
      },
      dependsOnIndex: unlockIndex === null ? [] : [unlockIndex],
    })
  }

  return specs
}
