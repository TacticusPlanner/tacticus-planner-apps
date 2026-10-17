import {
  getCharacters,
  getEquipment,
  getMows,
  getNpcs,
  getUnitPower,
  getUpgrades,
} from "@workspace/game-catalog/queries"

import { useReadState, type ReadState } from "@/shared/lib"
import {
  buildUnitPowerContext,
  type UnitPowerContext,
} from "./unit-power-context"

async function loadUnitPowerContext(): Promise<UnitPowerContext | null> {
  const [unitPower, characters, mows, npcs, equipment, upgrades] =
    await Promise.all([
      getUnitPower(),
      getCharacters(),
      getMows(),
      getNpcs(),
      getEquipment(),
      getUpgrades(),
    ])
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
 *  dataset is absent (not served yet, or not synced). */
export function useUnitPowerContext(): ReadState<UnitPowerContext | null> {
  return useReadState(loadUnitPowerContext, [])
}
