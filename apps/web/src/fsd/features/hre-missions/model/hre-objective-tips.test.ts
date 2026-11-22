import { describe, expect, it } from "vitest"

import { objectiveTipKeys } from "./hre-objective-tips"

describe("objectiveTipKeys", () => {
  it("adds the summons tip to every kill objective", () => {
    expect(objectiveTipKeys("killEnemies")).toEqual([
      "killEnemies",
      "killSummons",
    ])
    expect(objectiveTipKeys("killFaction")).toEqual([
      "killFaction",
      "killSummons",
    ])
  })

  it("gives other kinds their own tip only, and token kinds none", () => {
    expect(objectiveTipKeys("heal")).toEqual(["heal"])
    expect(objectiveTipKeys("campaignWins")).toEqual([])
    expect(objectiveTipKeys("arenaBattles")).toEqual([])
  })
})
