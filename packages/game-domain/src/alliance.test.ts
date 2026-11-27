import { describe, expect, it } from "vitest"

import { Alliance, isPlayableAlliance, playableAlliances } from "./alliance"

describe("playableAlliances", () => {
  it("lists every alliance except Neutral, Imperial first", () => {
    expect(playableAlliances).toEqual(["Imperial", "Chaos", "Xenos"])
  })

  it("recognises the playable alliance ids only", () => {
    expect(isPlayableAlliance(Alliance.Xenos)).toBe(true)
    expect(isPlayableAlliance(Alliance.Neutral)).toBe(false)
    expect(isPlayableAlliance("imperial")).toBe(false)
    expect(isPlayableAlliance("Summon")).toBe(false)
  })
})
