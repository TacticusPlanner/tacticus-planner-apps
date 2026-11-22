import type { UnitSummons } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

/**
 * The units a "no summons" rule leaves out (the LRE "No Summons" battle, the Quest Event "use no summons"
 * objective, the HRE summon-free mission): those whose catalog `summons` is `forced`, since a passive
 * ability summons on its own. An `optional` summoner stays: the player can keep it from summoning.
 */
export function forcedSummonerIds(
  units: Iterable<{ id: UnitId; summons: UnitSummons }>
): Set<UnitId> {
  const summoners = new Set<UnitId>()
  for (const unit of units) {
    if (unit.summons === "forced") summoners.add(unit.id)
  }
  return summoners
}
