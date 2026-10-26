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

import type { UpgradeRange } from "@/entities/goal"
import type {
  UpgradeWithFarmLocations,
  Character,
} from "@/features/rank-lookup/@x/goal-create"

import { isValidUpgradeQuantity } from "../target-edit/goal-target-edit"
import {
  characterRelevantUpgradeQuantities,
  computeUpgradeGoalNeed,
  mowRelevantUpgradeQuantities,
  type UpgradeRanges,
} from "./goal-spec-builder"

/**
 * The Upgrade goal's own state — its rank-range picker (Character only; a Mow has no single range
 * that unambiguously covers both ability tracks, so it stays scoped to its whole ladder, see
 * `relevantUpgradeQuantities` below), the repeatable target list, and the resource-requirement
 * preview. Kept as its own hook so `use-create-goal-form.ts` stays under the 800-line ceiling.
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
  // A Mow's two ability tracks each take an optional range of their own.
  const [mowActiveRange, setMowActiveRange] = useState<UpgradeRange | null>(
    null
  )
  const [mowPassiveRange, setMowPassiveRange] = useState<UpgradeRange | null>(
    null
  )
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
    if (mow) {
      return mowRelevantUpgradeQuantities(mow, upgradesById, {
        activeRange: mowActiveRange,
        passiveRange: mowPassiveRange,
      })
    }
    return new Map<UpgradeId, number>()
  }, [
    character,
    mow,
    upgradeRankStart,
    upgradeRankEnd,
    mowActiveRange,
    mowPassiveRange,
    upgradesById,
  ])

  // How many of each material the unit still needs over its whole remaining ladder (current rank to
  // the last for a Character, both full tracks for a Mow) — the quantity hint for a prefilled
  // material, which usually belongs to a later rank than the sheet's default one-rank range.
  const remainingLadderQuantities = useMemo(() => {
    if (upgradesById.size === 0) return undefined
    if (character) {
      return characterRelevantUpgradeQuantities(
        character,
        currentRank ?? firstRank,
        lastRank,
        upgradesById
      )
    }
    if (mow) {
      return mowRelevantUpgradeQuantities(mow, upgradesById, {
        activeRange: null,
        passiveRange: null,
      })
    }
    return undefined
  }, [character, mow, currentRank, upgradesById])

  // The range(s) sent with the goal: a Character's rank range, a Mow's set tracks only.
  const upgradeRanges = useMemo<UpgradeRanges>(() => {
    if (character) {
      return {
        rankRange: {
          start: rankIndex(upgradeRankStart),
          end: rankIndex(upgradeRankEnd),
        },
      }
    }
    return {
      ...(mowActiveRange && { activeRange: mowActiveRange }),
      ...(mowPassiveRange && { passiveRange: mowPassiveRange }),
    }
  }, [
    character,
    upgradeRankStart,
    upgradeRankEnd,
    mowActiveRange,
    mowPassiveRange,
  ])

  const upgradeGoalNeed = useMemo(
    () =>
      computeUpgradeGoalNeed({
        upgradeEnabled,
        // A row whose quantity is still being typed (or out of range) costs nothing until it is valid.
        targets: upgradeTargets.filter((target) =>
          isValidUpgradeQuantity(target.quantity)
        ),
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
    setMowActiveRange(null)
    setMowPassiveRange(null)
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

  // A target list is complete once it holds at least one distinct material; each row's quantity is
  // validated on its own (`invalidUpgradeQuantityIds`) so the message lands on that row.
  const isValid =
    !upgradeEnabled ||
    (upgradeTargets.length > 0 &&
      new Set(upgradeTargets.map((target) => target.upgradeId)).size ===
        upgradeTargets.length)
  const invalidUpgradeQuantityIds = upgradeTargets
    .filter((target) => !isValidUpgradeQuantity(target.quantity))
    .map((target) => target.upgradeId)
  // How many of each material the account owns, shown beside its target quantity.
  const ownedUpgradeQuantities = useMemo(
    () =>
      new Map(
        (inventoryUpgrades ?? []).map((entry) => [
          entry.upgradeId,
          entry.amount,
        ])
      ),
    [inventoryUpgrades]
  )

  return {
    state: {
      upgradeRankStart,
      setUpgradeRankStart,
      upgradeRankEnd,
      setUpgradeRankEnd,
      upgradeRankEndOptions,
      upgradeRankStartOptions,
      // Level n -> n+1 is recipe row n - 1, so a track of R rows spans levels 1..R+1.
      mowTrackMaxLevels: mow && {
        primary: mow.primaryAbility.recipes.length + 1,
        secondary: mow.secondaryAbility.recipes.length + 1,
      },
      mowActiveRange,
      setMowActiveRange,
      mowPassiveRange,
      setMowPassiveRange,
      upgradeRanges,
      upgradeTargets,
      addUpgradeTarget,
      removeUpgradeTarget,
      setUpgradeTargetQuantity,
      relevantUpgradeQuantities,
      remainingLadderQuantities,
      upgradeGoalNeed,
      invalidUpgradeQuantityIds,
      ownedUpgradeQuantities,
    },
    reset,
    prefillFrom,
    isValid,
  }
}
