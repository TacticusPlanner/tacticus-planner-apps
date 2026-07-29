import { describe, expect, it } from "vitest"

import { equipmentSlotIcon } from "./equipment"

describe("equipmentSlotIcon", () => {
  it("maps a known slot code to its icon path", () => {
    expect(equipmentSlotIcon("I_Crit")).toBe(
      "/game_catalog/equipment/ui_icon_itemtype_crit.png"
    )
  })

  it("returns undefined for an unrecognized slot", () => {
    expect(equipmentSlotIcon("I_Unknown")).toBeUndefined()
  })
})
