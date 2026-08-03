import type { MowStorageModel } from "@workspace/game-catalog"
import type { UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { FarmingUpgrade } from "../model/estimate.domain"
import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
} from ".//upgrade-recipe"

type MissingUpgradeEntry = {
  id: UpgradeId
  label: string
  missing: number
  required: number
  inventoryContribution: number
}

// A Machine of War's progression analogue to a Character's rank ladder (plan §16 phase 6) — MoWs
// have no rank at all; they progress via two independent ability-level tracks (primary/secondary),
// each with its own per-level upgrade-material recipe list. Colocated here (page-local, not a
// `features/mow-lookup` slice) since Goals is the only consumer today — no MoW Lookup page exists
// yet to share this with (mirrors estimate.ts's same page-scoped convention).

export type MowAbilityTrack = "primary" | "secondary"

type PlayerMow = PlayerDataChunkDto<"mows">[number]

/**
 * The upgrade ids consumed raising one ability track from `levelStart` to `levelEnd` (exclusive of
 * `levelStart`, through `levelEnd`) — a direct port of V1's `MowsService.getUpgradesRaw`. The
 * catalog's `recipes` array is 0-indexed with `recipes[i]` = the materials for reaching ability
 * level `i + 2` (level 1 is the free starting level, confirmed against the API's
 * `MowDenormalizer` — "cost[0] = level 2 … cost[n] = level n+2"), so the transitions consumed going
 * from `levelStart` to `levelEnd` sit at `recipes[levelStart - 1 .. levelEnd - 2]`. `[]` for an
 * empty/inverted range.
 */
export function mowAbilityUpgradeIds(
  recipes: readonly UpgradeId[][],
  levelStart: number,
  levelEnd: number
): UpgradeId[] {
  if (levelEnd <= levelStart) return []
  return recipes.slice(levelStart - 1, levelEnd - 1).flat()
}

/** Returns only level-transition recipes not already assigned to a higher-priority goal and marks
 * newly claimed transitions in `covered`. Transition keys are their source level. */
export function uncoveredMowAbilityUpgradeIds(
  recipes: readonly UpgradeId[][],
  levelStart: number,
  levelEnd: number,
  currentLevel: number,
  covered: Set<number>
): UpgradeId[] {
  const result: UpgradeId[] = []
  for (
    let level = Math.max(levelStart, currentLevel);
    level < levelEnd;
    level++
  ) {
    if (covered.has(level)) continue
    covered.add(level)
    result.push(...mowAbilityUpgradeIds(recipes, level, level + 1))
  }
  return result
}

/**
 * The player's current level for one ability track. The MoW catalog carries no id linking
 * `primaryAbility`/`secondaryAbility` to a synced `abilities[].abilityId` (those are Tacticus's own
 * opaque raw ability ids, with no name/id overlap with the catalog record at all) — so, matching how
 * V1 derived its flat `primaryAbilityLevel`/`secondaryAbilityLevel` fields from the same raw ordered
 * list, this reads by **array position**: `abilities[0]` is primary's current level,
 * `abilities[1]` is secondary's. Defaults to `1` (unowned/base, never negative-credits progress)
 * when the entry is missing — verify this ordering assumption against a real synced player response.
 */
export function mowAbilityTrackLevel(
  playerMow: PlayerMow | undefined,
  track: MowAbilityTrack
): number {
  const index = track === "primary" ? 0 : 1
  return playerMow?.abilities[index]?.level ?? 1
}

/**
 * Resource-requirement preview for a MoW Ability goal (plan §16 phase 6, user-confirmed scope: build
 * the preview, not just bare creation): the base upgrades still needed across both ability tracks —
 * `activeStart/End` targets `primaryAbility`, `passiveStart/End` targets `secondaryAbility` (mirrors
 * V1's primary→Active/secondary→Passive mapping onto the same `AbilityTarget` shape Character Ability
 * goals already use) — net of what's already applied toward each track's *current* level. Unlike
 * Character's `computeMissingUpgrades`, this does not factor in `appliedUpgradeSlots` (partial
 * progress within the in-progress level) — a deliberate, documented simplification (conservative:
 * undercounts what's owned rather than overcounting). `[]` when Ability isn't enabled or the MoW
 * catalog record isn't loaded yet.
 */
export function computeMowMissingUpgrades(params: {
  abilityEnabled: boolean
  mow: MowStorageModel | undefined
  playerMow: PlayerMow | undefined
  activeStart: number
  activeEnd: number
  passiveStart: number
  passiveEnd: number
  inventoryUpgrades:
    readonly { upgradeId: UpgradeId; amount: number }[] | undefined
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
  includeCovered?: boolean
}): MissingUpgradeEntry[] {
  const { abilityEnabled, mow, playerMow, upgradesById } = params
  if (!abilityEnabled || !mow) {
    return []
  }

  const requiredIds = [
    ...mowAbilityUpgradeIds(
      mow.primaryAbility.recipes,
      params.activeStart,
      params.activeEnd
    ),
    ...mowAbilityUpgradeIds(
      mow.secondaryAbility.recipes,
      params.passiveStart,
      params.passiveEnd
    ),
  ]
  const required = aggregateBaseUpgrades(requiredIds, upgradesById)

  const appliedIds = [
    ...mowAbilityUpgradeIds(
      mow.primaryAbility.recipes,
      1,
      mowAbilityTrackLevel(playerMow, "primary")
    ),
    ...mowAbilityUpgradeIds(
      mow.secondaryAbility.recipes,
      1,
      mowAbilityTrackLevel(playerMow, "secondary")
    ),
  ]
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
