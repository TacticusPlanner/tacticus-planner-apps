import { useMemo, useState } from "react"

import {
  firstRank,
  lastRank,
  rankAt,
  rankIndex,
  rankOrder,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

import type {
  UpgradeWithFarmLocations,
  Character,
} from "@/features/rank-lookup"

import {
  characterRelevantUpgradeQuantities,
  computeUpgradeGoalNeed,
  mowRelevantUpgradeQuantities,
} from "../estimate/goal-spec-builder"

/**
 * The Upgrade goal's own state — its rank-range picker (Character only; a Mow has no single range
 * that unambiguously covers both ability tracks, so it stays scoped to its whole ladder, see
 * `relevantUpgradeQuantities` below), the repeatable target list, and the resource-requirement
 * preview. Split out of `use-create-goal-form.ts` purely for that file's own max-lines budget.
 * `currentRank` is the unit's live synced rank (`playerCharacter?.rank`), same as `useRankFields`.
 */
export function useUpgradeFields({
  character,
  mow,
  upgradesById,
  currentRank,
  upgradeEnabled,
  inventoryUpgrades,
}: {
  character: Character | undefined
  mow: MowStorageModel | undefined
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  currentRank: Rank | undefined
  upgradeEnabled: boolean
  inventoryUpgrades:
    readonly { upgradeId: UpgradeId; amount: number }[] | undefined
}) {
  const [upgradeRankStart, setUpgradeRankStart] = useState<Rank>(firstRank)
  const [upgradeRankEnd, setUpgradeRankEnd] = useState<Rank>(rankAt(1))
  const [upgradeTargets, setUpgradeTargets] = useState<
    { upgradeId: UpgradeId; quantity: number }[]
  >([])

  const upgradeRankEndOptions = useMemo(() => {
    const options = rankOrder.filter(
      (r) => rankIndex(r) > rankIndex(upgradeRankStart)
    )
    return options.length > 0 ? options : [upgradeRankStart]
  }, [upgradeRankStart])
  const upgradeRankStartOptions = useMemo(
    () =>
      rankOrder.filter(
        (rank) => rankIndex(rank) >= rankIndex(currentRank ?? upgradeRankStart)
      ),
    [currentRank, upgradeRankStart]
  )

  // The upgrade ids an Upgrade goal on the current selection may target, each mapped to how many
  // are actually required — mirrors the backend's own relevance check (GameCatalogGoalLookups.cs)
  // so the picker only ever offers ids the server will actually accept, minus crafted upgrades
  // (never a direct target — see `countOccurrences`'s own doc comment in goal-spec-builder.ts).
  const relevantUpgradeQuantities = useMemo(() => {
    if (character) {
      return characterRelevantUpgradeQuantities(
        character,
        upgradeRankStart,
        upgradeRankEnd,
        upgradesById
      )
    }
    if (mow) return mowRelevantUpgradeQuantities(mow, upgradesById)
    return new Map<UpgradeId, number>()
  }, [character, mow, upgradeRankStart, upgradeRankEnd, upgradesById])

  const upgradeGoalNeed = useMemo(
    () =>
      computeUpgradeGoalNeed({
        upgradeEnabled,
        targets: upgradeTargets,
        inventoryUpgrades,
        upgradesById,
      }),
    [upgradeEnabled, upgradeTargets, inventoryUpgrades, upgradesById]
  )

  // `quantity` prefills from the picker's own required-amount hint (relevantUpgradeQuantities) —
  // still freely editable afterward via setUpgradeTargetQuantity, same as a manually typed value.
  const addUpgradeTarget = (upgradeId: UpgradeId, quantity: number) => {
    setUpgradeTargets((current) =>
      current.some((target) => target.upgradeId === upgradeId)
        ? current
        : [...current, { upgradeId, quantity: Math.max(1, quantity) }]
    )
  }

  const removeUpgradeTarget = (upgradeId: UpgradeId) => {
    setUpgradeTargets((current) =>
      current.filter((target) => target.upgradeId !== upgradeId)
    )
  }

  const setUpgradeTargetQuantity = (upgradeId: UpgradeId, quantity: number) => {
    setUpgradeTargets((current) =>
      current.map((target) =>
        target.upgradeId === upgradeId ? { ...target, quantity } : target
      )
    )
  }

  const reset = () => {
    setUpgradeRankStart(firstRank)
    setUpgradeRankEnd(rankAt(1))
    setUpgradeTargets([])
  }

  // Applies the synced current-rank prefill once per entity selection — called from the parent's
  // single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
  const prefillFrom = (rank: Rank | undefined) => {
    setUpgradeRankStart((current) => rank ?? current)
    setUpgradeRankEnd((current) => {
      if (!rank) return current
      return rankIndex(current) > rankIndex(rank)
        ? current
        : rankAt(Math.min(rankIndex(rank) + 1, rankIndex(lastRank)))
    })
  }

  const isValid =
    !upgradeEnabled ||
    (upgradeTargets.length > 0 &&
      upgradeTargets.every((target) => target.quantity > 0) &&
      new Set(upgradeTargets.map((target) => target.upgradeId)).size ===
        upgradeTargets.length)

  return {
    state: {
      upgradeRankStart,
      setUpgradeRankStart,
      upgradeRankEnd,
      setUpgradeRankEnd,
      upgradeRankEndOptions,
      upgradeRankStartOptions,
      upgradeTargets,
      addUpgradeTarget,
      removeUpgradeTarget,
      setUpgradeTargetQuantity,
      relevantUpgradeQuantities,
      upgradeGoalNeed,
    },
    reset,
    prefillFrom,
    isValid,
  }
}
