import { describe, expect, it } from "vitest"

import type { EquipmentId } from "@workspace/game-domain"

import { EquipmentIcons, equipmentSlotIcon } from "./equipment"

describe("equipmentSlotIcon", () => {
  it("maps a known slot code to its icon path", () => {
    expect(equipmentSlotIcon("I_Crit")).toBe(
      "/game_catalog/datamines/atlases/ui_icon_itemtype_crit.webp"
    )
  })

  it("returns undefined for an unrecognized slot", () => {
    expect(equipmentSlotIcon("I_Unknown")).toBeUndefined()
  })
})

describe("EquipmentIcons.icon", () => {
  it("builds the game item sprite path from the equipment id", () => {
    expect(EquipmentIcons.icon("I_Block_C002" as EquipmentId)).toBe(
      "/game_catalog/datamines/items/ui_icon_item_I_Block_C002.webp"
    )
  })

  it("uses the game's capitalization where it differs from the id", () => {
    expect(EquipmentIcons.icon("R_Block_DaemonfleshPlate" as EquipmentId)).toBe(
      "/game_catalog/datamines/items/ui_icon_item_R_Block_DaemonFleshPlate.webp"
    )
  })
})
