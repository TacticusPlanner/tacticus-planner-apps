import type { BattleId } from "@workspace/game-domain"

import type {
  Battle,
  EstimateBlockedReason,
  EstimateResourceId,
  EstimateUpgrade,
  FarmLocation,
  FarmNode,
  FarmNodeFilter,
  UpgradeNeed,
} from "../model/estimate.domain"
import { unavailableReason } from "./estimate-blocked"

/**
 * The chance a single run drops this location's material: 1 for a guaranteed drop, the precomputed
 * `effectiveRate` when present, else the raw `numerator/denominator` fraction, else 0. Duplicated
 * from `@/shared/lib`'s `campaign-insights.ts` rather than imported, per this codebase's cross-file
 * duplication convention for small pure helpers.
 */
export function dropRate(location: FarmLocation): number {
  if (location.effectiveRate != null) return location.effectiveRate
  if (location.guaranteed) return 1
  if (location.numerator != null && location.denominator) {
    return location.numerator / location.denominator
  }
  return 0
}

/**
 * The farm node(s) to raid for one material need: every location restricted to `farmingLocationIds`
 * when the goal pins specific nodes, otherwise the least-`energyPerItem` node(s) across all its drop
 * locations, every node tied on two-decimal `energyPerItem`, ordered higher `expectedGold` first (a port of V1
 * `CampaignsService.selectBestLocations`, which sorts `['energyPerItem', 'expectedGold']` ascending
 * then descending — a location with no `expectedGold` sorts lowest for this tie-break, never winning
 * over one that reports a value). Locations with no energy cost or no drop chance are never
 * selectable. Empty when the material can't be farmed at all.
 */
export function selectFarmNodes(
  need: UpgradeNeed,
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  farmingLocationIds?: readonly string[] | null,
  nodeFilter?: FarmNodeFilter
): FarmNode[] {
  return pickFarmNodes(
    need,
    upgradesById,
    battlesById,
    farmingLocationIds,
    nodeFilter
  ).nodes
}

/**
 * `selectFarmNodes` with its intermediate: `picked` is the preferred set before `nodeFilter`, `nodes`
 * what survives it. The filter runs after the pick, so a restrictive filter never promotes a pricier
 * node (a material whose picked nodes all fail is filtered out, not rerouted) and a goal's pinned
 * locations are filtered like any other set.
 */
function pickFarmNodes(
  need: UpgradeNeed,
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  farmingLocationIds?: readonly string[] | null,
  nodeFilter?: FarmNodeFilter
): { picked: FarmNode[]; nodes: FarmNode[] } {
  const upgrade = upgradesById.get(need.id)
  if (!upgrade) return { picked: [], nodes: [] }

  const restricted = !!farmingLocationIds && farmingLocationIds.length > 0
  const candidates = collectFarmNodes(
    upgrade,
    battlesById,
    restricted ? farmingLocationIds : undefined
  )
  let picked = candidates
  if (candidates.length > 0 && !restricted) {
    // Tie test only: two-decimal efficiency as V1 (`campaigns.service.ts`); nodes keep their real dropRate.
    const efficiency = (c: FarmNode) =>
      Number((c.energyCost / c.dropRate).toFixed(2))
    const minEnergyPerItem = Math.min(...candidates.map(efficiency))
    picked = candidates
      .filter((c) => efficiency(c) === minEnergyPerItem)
      .sort((a, b) => (b.expectedGold ?? -1) - (a.expectedGold ?? -1))
  }
  return {
    picked,
    nodes: nodeFilter
      ? picked.filter((node) => nodeFilter(node.battleId, need.id))
      : picked,
  }
}

/**
 * Every raidable node of one material: a battle in `battlesById` with an energy cost and a drop rate
 * above 0, drop rates of a battle listed twice summed, optionally restricted to the goal's pinned
 * `farmingLocationIds`. The shared base of Today's pick and the Dailies > HSE farm list, so node
 * eligibility cannot drift between them.
 */
export function collectFarmNodes(
  upgrade: EstimateUpgrade,
  battlesById: ReadonlyMap<BattleId, Battle>,
  farmingLocationIds?: readonly string[]
): FarmNode[] {
  const candidatesByBattle = new Map<BattleId, FarmNode>()
  for (const location of upgrade.farmLocations) {
    const battle = battlesById.get(location.battleId)
    if (!battle || battle.energyCost <= 0) continue

    const rate = dropRate(location)
    if (rate <= 0) continue

    if (farmingLocationIds && !farmingLocationIds.includes(location.battleId)) {
      continue
    }

    const existing = candidatesByBattle.get(location.battleId)
    if (existing) {
      existing.dropRate += rate
    } else {
      candidatesByBattle.set(location.battleId, {
        battleId: location.battleId,
        energyCost: battle.energyCost,
        dropRate: rate,
        dailyAttempts: battle.dailyAttempts,
        expectedGold: location.expectedGold,
      })
    }
  }

  return [...candidatesByBattle.values()]
}

/**
 * Classifies one residual need: the farm nodes to raid for it, or the reason it has no supported
 * source (a flat supplier makes a campaign-less need actionable). Shared by `estimateGoal` and the
 * plan estimate so both classify every need identically.
 */
export function classifyNeed(
  need: UpgradeNeed,
  hasSupplier: boolean,
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  farmingLocationIds: readonly string[] | null | undefined,
  dailyEnergy: number,
  nodeFilter?: FarmNodeFilter
): {
  nodes: FarmNode[]
  blocker: EstimateBlockedReason | null
  /** Set with a `FilteredOut` blocker when the goal's pinned locations are what the filter removed. */
  pinned?: boolean
} {
  const unavailable = unavailableReason(
    need,
    upgradesById,
    battlesById,
    farmingLocationIds,
    dailyEnergy
  )
  if (unavailable && !hasSupplier) return { nodes: [], blocker: unavailable }
  const { picked, nodes } = unavailable
    ? { picked: [], nodes: [] }
    : pickFarmNodes(
        need,
        upgradesById,
        battlesById,
        farmingLocationIds,
        nodeFilter
      )
  if (nodes.length === 0 && !unavailable && !hasSupplier) {
    if (picked.length > 0) {
      return {
        nodes,
        blocker: "FilteredOut",
        pinned: !!farmingLocationIds && farmingLocationIds.length > 0,
      }
    }
    return { nodes, blocker: "NoFarmLocation" }
  }
  return { nodes, blocker: null }
}
