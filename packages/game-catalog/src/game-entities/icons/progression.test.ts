import { describe, expect, it } from "vitest"

import { progressionVisual } from "./progression"

describe("progressionVisual", () => {
  it("renders no icon for None", () => {
    expect(progressionVisual("Common:None")).toEqual({ kind: "none" })
  })

  it("renders gold stars for the first five steps", () => {
    expect(progressionVisual("Common:OneStar")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/gold.png",
      count: 1,
    })
    expect(progressionVisual("Rare:FiveStars")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/gold.png",
      count: 5,
    })
  })

  it("renders red stars for the next five steps", () => {
    expect(progressionVisual("Rare:RedOneStar")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/red.png",
      count: 1,
    })
    expect(progressionVisual("Legendary:RedFiveStars")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/red.png",
      count: 5,
    })
  })

  it("renders blue stars for the next three steps", () => {
    expect(progressionVisual("Legendary:OneBlueStar")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/ui_icon_star_legendary_large.png",
      count: 1,
    })
    expect(progressionVisual("Mythic:ThreeBlueStars")).toEqual({
      kind: "stars",
      icon: "/game_catalog/stars/ui_icon_star_legendary_large.png",
      count: 3,
    })
  })

  it("renders a single wings icon for the max step", () => {
    expect(progressionVisual("Mythic:MythicWings")).toEqual({
      kind: "wings",
      icon: "/game_catalog/stars/ui_icon_star_mythic.png",
    })
  })
})
