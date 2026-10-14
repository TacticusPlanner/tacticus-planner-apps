import { describe, expect, it } from "vitest"

import { mythicLevel } from "./mow-unit.view-model"

describe("mythicLevel", () => {
  it("follows the blue stars, 1 to 4", () => {
    expect(mythicLevel("Mythic:OneBlueStar")).toBe(1)
    expect(mythicLevel("Mythic:TwoBlueStars")).toBe(2)
    expect(mythicLevel("Mythic:ThreeBlueStars")).toBe(3)
    expect(mythicLevel("Mythic:MythicWings")).toBe(4)
  })

  it("is not unlocked below Mythic", () => {
    expect(mythicLevel("Legendary:RedFiveStars")).toBeUndefined()
    expect(mythicLevel("Common:None")).toBeUndefined()
  })
})
