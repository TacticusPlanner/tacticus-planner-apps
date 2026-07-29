import { describe, expect, it } from "vitest"

import { damageTypeIcon } from "./damage-type"

describe("damageTypeIcon", () => {
  it("builds the icon path directly from the PascalCase damage type id", () => {
    expect(damageTypeIcon("Physical")).toBe(
      "/game_catalog/damage_icons/ui_icon_damage_profile2_Physical.png"
    )
    expect(damageTypeIcon("HeavyRound")).toBe(
      "/game_catalog/damage_icons/ui_icon_damage_profile2_HeavyRound.png"
    )
  })
})
