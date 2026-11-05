import type { BattleId } from "@workspace/game-domain"

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
}

/**
 * Every location that earns event points, goals ignored, as if energy were unlimited: each gets
 * the attempts it has left today (`attemptsLeftByBattle`, else its daily cap). A location is left
 * out when it has no attempts left, fails the Raids Filters (`passesFilter`) or scores zero. Ranked
 * by points per energy, ties by higher points per raid, then lower energy cost (then battle id).
 */
export function selectEventLocations({
  battles,
  pointsByBattleId,
  attemptsLeftByBattle,
  passesFilter,
}: {
  battles: readonly EventLocationBattle[]
  pointsByBattleId: ReadonlyMap<string, number>
  attemptsLeftByBattle: ReadonlyMap<string, number>
  passesFilter: (battleId: string) => boolean
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
