import { useMemo, useState } from "react"

import type {
  CharacterStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { FarmLocation } from "@/shared/lib"

import { dropRate, estimateGoal } from "@/features/goal-farming"
import { estimateRemainingShardEnergy } from "@/features/goal-farming"

/** The id of `locations`' lowest expected-energy-per-shard node (`battle.energyCost / dropRate`,
 *  the same per-item economics `GoalShardLocationsField`'s own per-location figure uses), or
 *  `undefined` when none price out (missing battle data, or a location with a zero drop rate). */
function cheapestLocationId(
  locations: readonly FarmLocation[],
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
): string | undefined {
  let bestId: string | undefined
  let bestEnergy = Number.POSITIVE_INFINITY
  for (const location of locations) {
    const battle = battlesById.get(location.battleId)
    const rate = dropRate(location)
    if (!battle || battle.energyCost <= 0 || rate <= 0) continue
    const energyPerShard = battle.energyCost / rate
    if (energyPerShard < bestEnergy) {
      bestEnergy = energyPerShard
      bestId = location.battleId
    }
  }
  return bestId
}

/** The default selection for a fresh (never manually touched) entity: the lowest expected-energy-
 *  per-shard node of each type present, so an estimate is visible without the user picking anything
 *  first. Derived directly from the catalog rather than seeded into state via an effect — keeps this
 *  in sync for free as `battlesById`'s own live query finishes loading, with no cascading-render risk. */
function defaultLocationIds(
  regularShardLocations: readonly FarmLocation[],
  mythicShardLocations: readonly FarmLocation[],
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
): string[] {
  return [
    cheapestLocationId(regularShardLocations, battlesById),
    cheapestLocationId(mythicShardLocations, battlesById),
  ].filter((id): id is string => id != null)
}

/**
 * Which of the selected character's shard farm nodes (Unlock/Ascension only) to restrict farming to,
 * plus the Unlock card's own "X out of Y shards required to unlock at R" + remaining-energy figures
 * that selection feeds — split out of use-create-goal-form.ts purely for that file's own max-lines
 * budget. `shardLocationIds` is one flat selection set spanning both shard types (a battle id is
 * unambiguously one or the other, per the catalog's own `isMythic` tag), split here into
 * `selected{Regular,Mythic}ShardLocationIds` so callers never have to re-derive it: Unlock only ever
 * costs regular shards (`unlockResourceNeed`'s always-zero mythicShards), so its own energy estimate
 * below is restricted to regular locations only — mixing in a mythic-only node here would otherwise
 * let the engine credit a location that can never actually drop a regular shard. The lowest expected-
 * energy-per-shard node of each type is selected by default (see `defaultLocationIds`), so an
 * estimate is visible without the user having to pick anything first; the user can still uncheck it
 * back down to zero, which reads as "no restriction" the same way it always has (the engine then
 * auto-picks the least-energy node(s) among all of that type, mirroring goal-locations-field.tsx's
 * detail-sheet convention) — `manualSelection` tracks only genuine user edits (`null` means "still on
 * the default"), so the default stays live against `battlesById`'s own async load instead of being
 * snapshotted into state once and going stale.
 */
export function useShardLocationSelection(params: {
  entityType: "Character" | "Mow"
  entityId: string | undefined
  charactersById: ReadonlyMap<string, CharacterStorageModel> | undefined
  unlockShardCostsById:
    ReadonlyMap<string, UnlockShardCostStorageModel> | undefined
  lockedShards: number | undefined
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
  dailyEnergy: number
}) {
  const characterView =
    params.entityType === "Character" && params.entityId
      ? params.charactersById?.get(params.entityId)
      : undefined

  const regularShardLocations = useMemo(
    () =>
      characterView?.shardLocations.filter((location) => !location.isMythic) ??
      [],
    [characterView]
  )
  const mythicShardLocations = useMemo(
    () =>
      characterView?.shardLocations.filter((location) => location.isMythic) ??
      [],
    [characterView]
  )

  // `null` means "no explicit user edit yet for this entity" — `shardLocationIds` below then reads
  // the live default instead. Set to a real (possibly empty) array on the first toggle, and reset
  // back to `null` by `reset()` (entity switch, "create another").
  const [manualSelection, setManualSelection] = useState<string[] | null>(null)

  const defaultShardLocationIds = useMemo(
    () =>
      defaultLocationIds(
        regularShardLocations,
        mythicShardLocations,
        params.battlesById
      ),
    [regularShardLocations, mythicShardLocations, params.battlesById]
  )
  const shardLocationIds = manualSelection ?? defaultShardLocationIds

  const toggleShardLocation = (battleId: string, enabled: boolean) => {
    setManualSelection((current) => {
      const base = current ?? defaultShardLocationIds
      return enabled
        ? [...base, battleId]
        : base.filter((id) => id !== battleId)
    })
  }

  const reset = () => setManualSelection(null)

  const selectedRegularShardLocationIds = useMemo(() => {
    const regularIds = new Set<string>(
      regularShardLocations.map((location) => location.battleId)
    )
    return shardLocationIds.filter((id) => regularIds.has(id))
  }, [shardLocationIds, regularShardLocations])
  const selectedMythicShardLocationIds = useMemo(() => {
    const mythicIds = new Set<string>(
      mythicShardLocations.map((location) => location.battleId)
    )
    return shardLocationIds.filter((id) => mythicIds.has(id))
  }, [shardLocationIds, mythicShardLocations])

  // "X out of Y shards required to unlock at R" + the energy to farm the remainder from the
  // selected shard locations (plan: Unlock resources-needed format) — Character only, and only once
  // the catalog's per-rarity unlock-shard table has loaded. Regular shards only, matching
  // `unlockResourceNeed`'s always-zero mythicShards for Unlock.
  const unlockRequirement = useMemo(() => {
    if (params.entityType !== "Character" || !params.entityId) return null
    const rarity = characterView?.initialRarity
    const totalShards = rarity
      ? params.unlockShardCostsById?.get(rarity)?.shards
      : 0
    if (!rarity || !totalShards) return null

    const ownedShards = params.lockedShards ?? 0
    const remainingShards = Math.max(0, totalShards - ownedShards)
    // No location selected yet means no estimate at all here (rather than falling back to
    // `estimateRemainingShardEnergy`'s usual "unrestricted, auto-pick the cheapest node" behavior) —
    // in practice this only shows once the user has manually deselected every location, since one is
    // selected by default as soon as the entity's shard locations are known (see
    // `defaultShardLocationIds` above).
    const energyEstimate =
      selectedRegularShardLocationIds.length > 0
        ? estimateRemainingShardEnergy({
            entityId: params.entityId,
            remainingShards,
            shardLocations: regularShardLocations,
            battlesById: params.battlesById,
            farmingLocationIds: selectedRegularShardLocationIds,
            dailyEnergy: params.dailyEnergy,
          })
        : null

    return { ownedShards, totalShards, rarity, energyEstimate }
  }, [
    params.entityType,
    params.entityId,
    characterView,
    params.unlockShardCostsById,
    params.lockedShards,
    params.battlesById,
    regularShardLocations,
    selectedRegularShardLocationIds,
    params.dailyEnergy,
  ])

  return {
    shardLocationIds,
    toggleShardLocation,
    reset,
    unlockRequirement,
    regularShardLocations,
    mythicShardLocations,
    selectedRegularShardLocationIds,
    selectedMythicShardLocationIds,
  }
}
