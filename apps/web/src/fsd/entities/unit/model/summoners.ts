import type { UnitSummons } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

/**
 * The units a "no summons" rule leaves out (the LRE "No Summons" battle, the Quest Event "use no summons"
 * objective, the HRE summon-free mission): those whose catalog `summons` is `passive`, since a passive
 * ability can summon on its own. An `active` summoner stays: the player can leave its ability unused.
 */
export function passiveSummonerIds(
  units: Iterable<{ id: UnitId; summons: UnitSummons }>
): Set<UnitId> {
  const summoners = new Set<UnitId>()
  for (const unit of units) {
    if (unit.summons === "passive") summoners.add(unit.id)
  }
  return summoners
}
