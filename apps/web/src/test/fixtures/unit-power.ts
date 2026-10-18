// The served `unit-power` record and the catalog units, items and upgrades the power tests read,
// copied from the real catalog source (tacticus-planner-api GameCatalog Data): every Ultramarines
// character, Kharn, Gulgortz and Uthar, the Biovore and Dreadnought MoWs, the Dark Angels
// Infiltrator NPC, the items V1's in-game references wear plus the Ultramarines relics, and the
// stat of every upgrade those characters rank up with.
import {
  buildUnitPowerContext,
  type UnitPowerCatalog,
  type UnitPowerContext,
} from "@/shared/unit-power"

import catalog from "./unit-power-catalog.json"

export const unitPowerCatalog = catalog as unknown as UnitPowerCatalog & {
  unitPower: NonNullable<UnitPowerCatalog["unitPower"]>
}

export function unitPowerContextFixture(): UnitPowerContext {
  const context = buildUnitPowerContext(unitPowerCatalog)
  if (!context) throw new Error("The unit-power fixture has no record")
  return context
}
