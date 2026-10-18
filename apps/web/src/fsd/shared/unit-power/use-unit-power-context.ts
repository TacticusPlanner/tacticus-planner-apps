import {
  getCharacters,
  getEquipment,
  getMows,
  getNpcs,
  getUnitPower,
  getUpgrades,
  hasGameCatalogSynced,
} from "@workspace/game-catalog/queries"

import { useReadState, type ReadState } from "@/shared/lib"
import {
  buildUnitPowerContext,
  type UnitPowerContext,
} from "./unit-power-context"

/** The catalog has not finished its first sync: an empty `unit-power` store means "not here yet",
 *  not "not served". */
const NOT_SYNCED = Symbol("not-synced")

async function loadUnitPowerContext(): Promise<
  UnitPowerContext | null | typeof NOT_SYNCED
> {
  const [unitPower, characters, mows, npcs, equipment, upgrades] =
    await Promise.all([
      getUnitPower(),
      getCharacters(),
      getMows(),
      getNpcs(),
      getEquipment(),
      getUpgrades(),
    ])
  // Only consulted when the dataset is missing. Read inside the live query, so the context loads
  // as soon as the first sync writes its manifest row.
  if (!unitPower && !(await hasGameCatalogSynced())) return NOT_SYNCED
  return buildUnitPowerContext({
    unitPower,
    characters,
    mows,
    npcs,
    equipment,
    upgrades,
  })
}

/** The power context, rebuilt when the catalog changes; `data` is null when the `unit-power`
 *  dataset is absent (not served by a catalog that has synced). Before the catalog's first sync
 *  completes (a fresh device) it stays `loading`, so pages show their placeholder rather than
 *  "unavailable" or power 0. */
export function useUnitPowerContext(): ReadState<UnitPowerContext | null> {
  const read = useReadState(loadUnitPowerContext, [])
  if (read.status === "ready" && read.data === NOT_SYNCED) {
    return { status: "loading", retry: read.retry }
  }
  return read as ReadState<UnitPowerContext | null>
}
