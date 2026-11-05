import type { BattleId } from "@workspace/game-domain"

import type { EventFarmOrder } from "./home-screen-event-farm"

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
}

type EventLocationBattle = {
  id: string
  energyCost: number
  dailyAttempts: number
  /** Drop rate per resource the node can drop. */
  dropRates: ReadonlyMap<string, number>
}

/**
 * Every location that earns event points, goals ignored, as if energy were unlimited: each gets
 * the attempts it has left today (`attemptsLeftByBattle`, else its daily cap). A location is left
 * out when it has no attempts left, fails the Raids Filters (`passesFilter`) or scores zero.
 *
 * `order: "points"` ranks by points per energy, ties by higher points per raid, then lower energy
 * cost (then battle id). `order: "energy"` first keeps only the locations Today would pick for a
 * material they drop (least energy per item over the passing locations, tied on two decimals; the
 * costliest per battle of those with `fewerRaids`), then ranks them the same way.
 */
export function selectEventLocations({
  battles,
  pointsByBattleId,
  attemptsLeftByBattle,
  passesFilter,
  order = "points",
  fewerRaids = false,
}: {
  battles: readonly EventLocationBattle[]
  pointsByBattleId: ReadonlyMap<string, number>
  attemptsLeftByBattle: ReadonlyMap<string, number>
  passesFilter: (battleId: string) => boolean
  order?: EventFarmOrder
  fewerRaids?: boolean
}): EventLocation[] {
  const passing = battles.filter(
    (battle) => battle.energyCost > 0 && passesFilter(battle.id)
  )
  const efficient =
    order === "energy" ? efficientBattleIds(passing, fewerRaids) : null
  const ranked: EventLocation[] = []
  for (const battle of passing) {
    if (efficient && !efficient.has(battle.id)) continue
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
    })
  }
  return ranked.sort(
    (a, b) =>
      b.pointsPerEnergy - a.pointsPerEnergy ||
      b.pointsPerRaid - a.pointsPerRaid ||
      a.energyCost - b.energyCost ||
      a.battleId.localeCompare(b.battleId)
  )
}

/** The battles that are the least-energy-per-item location of at least one resource they drop. */
function efficientBattleIds(
  battles: readonly EventLocationBattle[],
  fewerRaids: boolean
): Set<string> {
  const byResource = new Map<string, EventLocationBattle[]>()
  for (const battle of battles) {
    for (const [resourceId, rate] of battle.dropRates) {
      if (rate <= 0) continue
      const list = byResource.get(resourceId) ?? []
      list.push(battle)
      byResource.set(resourceId, list)
    }
  }
  const ids = new Set<string>()
  for (const [resourceId, list] of byResource) {
    const efficiency = (battle: EventLocationBattle) =>
      Number(
        (battle.energyCost / (battle.dropRates.get(resourceId) ?? 0)).toFixed(2)
      )
    const least = Math.min(...list.map(efficiency))
    let cheapest = list.filter((battle) => efficiency(battle) === least)
    if (fewerRaids) {
      const most = Math.max(...cheapest.map((battle) => battle.energyCost))
      cheapest = cheapest.filter((battle) => battle.energyCost === most)
    }
    for (const battle of cheapest) ids.add(battle.id)
  }
  return ids
}
