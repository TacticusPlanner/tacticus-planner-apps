import type { BattleId } from "@workspace/game-domain"

import {
  collectFarmNodes,
  type EstimateUpgrade,
} from "@/features/goal-farming/@x/daily-raids"
import type { Battle } from "@/shared/lib"

import { dropEfficiency, type EventFarmOrder } from "./home-screen-event-farm"

/** One location of the Dailies > HSE list with "Ignore goals" on. */
export type EventLocation = {
  battleId: BattleId
  pointsPerRaid: number
  pointsPerEnergy: number
  energyCost: number
  /** Attempts left today; null when the node has no daily cap. */
  raids: number | null
  /** Points of those raids; null with no daily cap. */
  points: number | null
  /** Energy per item of the location's drop; null when it drops no farmable material. */
  energyPerItem: number | null
}

/** A location's drop, rated as `dropEfficiency` rates it (1 = the cheapest location for it). */
export type LocationDrop = { energyPerItem: number; efficiency: number }

type EventLocationBattle = {
  id: string
  energyCost: number
  dailyAttempts: number
}

/**
 * Every location that earns event points, goals ignored, as if energy were unlimited: each gets
 * the attempts it has left today (`attemptsLeftByBattle`, else its daily cap). A location is left
 * out when it has no attempts left, fails the Raids Filters (`passesFilter`) or scores zero. Ranked
 * by points per energy, ties by higher points per raid, then lower energy cost (then battle id).
 * `order: "energy"` ranks by the drop's efficiency first (`dropByBattleId`; a location without a
 * rated drop last), then the same order; with `fewerRaids` the costlier battle first among equals.
 */
export function selectEventLocations({
  battles,
  pointsByBattleId,
  attemptsLeftByBattle,
  passesFilter,
  dropByBattleId = new Map(),
  order = "points",
  fewerRaids = false,
}: {
  battles: readonly EventLocationBattle[]
  pointsByBattleId: ReadonlyMap<string, number>
  attemptsLeftByBattle: ReadonlyMap<string, number>
  passesFilter: (battleId: string) => boolean
  dropByBattleId?: ReadonlyMap<string, LocationDrop>
  order?: EventFarmOrder
  fewerRaids?: boolean
}): EventLocation[] {
  const ranked: EventLocation[] = []
  for (const battle of battles) {
    if (battle.energyCost <= 0 || !passesFilter(battle.id)) continue
    const pointsPerRaid = pointsByBattleId.get(battle.id) ?? 0
    if (pointsPerRaid <= 0) continue
    const left =
      attemptsLeftByBattle.get(battle.id) ??
      (battle.dailyAttempts > 0 ? battle.dailyAttempts : null)
    if (left !== null && left <= 0) continue
    ranked.push({
      battleId: battle.id as BattleId,
      pointsPerRaid,
      pointsPerEnergy: pointsPerRaid / battle.energyCost,
      energyCost: battle.energyCost,
      raids: left,
      points: left === null ? null : left * pointsPerRaid,
      energyPerItem: dropByBattleId.get(battle.id)?.energyPerItem ?? null,
    })
  }
  const efficiency = (location: EventLocation) =>
    dropByBattleId.get(location.battleId)?.efficiency ?? Infinity
  return ranked.sort(
    (a, b) =>
      (order === "energy"
        ? compareEfficiency(efficiency(a), efficiency(b)) ||
          (fewerRaids ? b.energyCost - a.energyCost : 0)
        : 0) ||
      b.pointsPerEnergy - a.pointsPerEnergy ||
      b.pointsPerRaid - a.pointsPerRaid ||
      a.energyCost - b.energyCost ||
      a.battleId.localeCompare(b.battleId)
  )
}

// Infinity - Infinity is NaN, which a sort comparator must never return.
const compareEfficiency = (a: number, b: number) => (a === b ? 0 : a - b)

/**
 * Rates each location by the best of its drops: its energy per item and how that compares with the
 * cheapest location for the same item among `battlesById` (`dropEfficiency`). Pass the locations
 * that pass the filters, as Today picks among them.
 */
export function buildLocationDrops(
  items: Iterable<EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>
): Map<BattleId, LocationDrop> {
  const drops = new Map<BattleId, LocationDrop>()
  for (const item of items) {
    const nodes = collectFarmNodes(item, battlesById)
    const efficiencyOf = dropEfficiency(nodes)
    for (const node of nodes) {
      const drop = {
        energyPerItem: node.energyCost / node.dropRate,
        efficiency: efficiencyOf(node),
      }
      const current = drops.get(node.battleId)
      if (!current || drop.efficiency < current.efficiency) {
        drops.set(node.battleId, drop)
      }
    }
  }
  return drops
}
