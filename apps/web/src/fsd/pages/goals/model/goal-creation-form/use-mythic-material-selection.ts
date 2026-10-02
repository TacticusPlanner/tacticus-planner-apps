import { useMemo, useState } from "react"
import type { UpgradeId } from "@workspace/game-domain"

import type { AcquisitionSource } from "@/entities/goal"
import {
  estimateGoal,
  neededMythicMaterialIds,
  projectShopSupply,
  selectMythicMaterialOffers,
  useMythicMaterialShopOffers,
} from "@/features/goal-farming"
import { summariseShopCurrencySpend } from "./use-progression-preview"

function seedShopIds(seed: readonly AcquisitionSource[] | null | undefined) {
  if (!seed) return null
  return seed.find((source) => source.kind === "Shop")?.ids ?? []
}

/**
 * The Mythic-material shop-offer selection for Rank, Upgrade, and Machine-of-War Ability goals
 * (add-mythic-material-shop-sources), shared by goal creation and the Edit goal dialog. `null` means
 * "no explicit choice": every offer currently listed is used (and shown checked), and nothing is saved.
 * The first toggle pins the listed offers as an explicit selection, then toggles.
 */
export function useMythicMaterialSelection(params: {
  /** The goal's needed base materials (`missing` = still needed); only the four Mythic materials
   *  matter. Compared by value, so callers may pass a fresh array each render. */
  needs: readonly { id: string; missing: number }[]
  /** A saved goal's `acquisitionSources` (edit). Omit for a new goal. */
  seed?: readonly AcquisitionSource[] | null
  /** Changing it (a newly picked unit) drops back to the seed/default. */
  resetKey?: string
  /** Day 1 of the preview estimate; defaults to now. */
  referenceDate?: Date
}) {
  const needsKey = JSON.stringify(
    params.needs
      .filter((need) => need.missing > 0)
      .map((need) => [need.id, need.missing])
  )
  const mythicNeeds = useMemo(() => {
    const needs = JSON.parse(needsKey) as [string, number][]
    const ids = new Set(neededMythicMaterialIds(needs.map(([id]) => id)))
    const counts = new Map<string, number>()
    for (const [id, missing] of needs) {
      if (ids.has(id)) counts.set(id, (counts.get(id) ?? 0) + missing)
    }
    return [...counts].map(([id, count]) => ({ id, count }))
  }, [needsKey])
  const materialIds = useMemo(
    () => mythicNeeds.map((need) => need.id),
    [mythicNeeds]
  )
  const { offers: allOffers, failed } = useMythicMaterialShopOffers(materialIds)
  const offers = materialIds.length > 0 ? allOffers : []

  const [state, setState] = useState(() => ({
    resetKey: params.resetKey,
    selection: seedShopIds(params.seed),
  }))
  if (state.resetKey !== params.resetKey) {
    setState({ resetKey: params.resetKey, selection: seedShopIds(params.seed) })
  }
  const { selection } = state
  const listedIds = offers?.map((offer) => offer.offerId) ?? []
  const checkedIds = selection ?? listedIds
  const acquisitionSources: AcquisitionSource[] | null =
    selection === null ? null : [{ kind: "Shop", ids: selection }]

  const toggle = (offerId: string, checked: boolean) =>
    setState((current) => {
      const base = (current.selection ?? listedIds).filter(
        (id) => id !== offerId
      )
      return { ...current, selection: checked ? [...base, offerId] : base }
    })

  // Single-goal preview of what the used offers spend on the Mythic needs (spec: *The goal preview
  // shows the selected offers' currency spend*) — the materials have no campaign source here, so the
  // shops cover the whole need, split by the same day-by-day attribution the plan uses.
  const currencySpend = useMemo(() => {
    if (!offers?.length || mythicNeeds.length === 0) return []
    const used = selectMythicMaterialOffers(acquisitionSources, offers)
    if (used.length === 0) return []
    const referenceDate = params.referenceDate ?? new Date()
    const outcome = estimateGoal({
      needs: mythicNeeds.map((need) => ({
        id: need.id as UpgradeId,
        count: need.count,
      })),
      upgradesById: new Map(),
      battlesById: new Map(),
      dailyEnergy: 0,
      flatSuppliers: used.map((offer) =>
        projectShopSupply(offer, referenceDate)
      ),
      referenceDate,
    })
    if (outcome.status === "Blocked" || !outcome.flatSupplyBySupplier) return []
    return summariseShopCurrencySpend(used, outcome.flatSupplyBySupplier)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, mythicNeeds, selection])

  return {
    materialIds,
    /** `undefined` while loading. */
    offers,
    failed,
    checkedIds,
    toggle,
    /** What to save: `null` keeps the all-available default (send nothing). */
    acquisitionSources,
    /** True once the user has made an explicit choice that differs from `seed`. */
    changed:
      JSON.stringify(selection) !== JSON.stringify(seedShopIds(params.seed)),
    currencySpend,
    reset: () => setState((current) => ({ ...current, selection: null })),
  }
}

export type MythicMaterialSelection = ReturnType<
  typeof useMythicMaterialSelection
>
