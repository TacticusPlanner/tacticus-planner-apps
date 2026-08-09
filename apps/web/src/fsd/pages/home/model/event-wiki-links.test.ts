import { describe, expect, it } from "vitest"

import { resolveEventWikiUrl } from "./event-wiki-links"

describe("resolveEventWikiUrl", () => {
  it("returns a wiki URL for a definition with a known article", () => {
    expect(resolveEventWikiUrl("battle-pass")).toBe(
      "https://tacticus.fandom.com/wiki/BattlePass"
    )
  })

  it("returns the same URL for every Tournament Arena ruleset", () => {
    const urls = [
      "ta-faction-war",
      "ta-power-ups",
      "ta-conquest",
      "ta-draft-power-ups",
      "ta-infested-power-ups",
    ].map(resolveEventWikiUrl)

    expect(new Set(urls).size).toBe(1)
    expect(urls[0]).toBe("https://tacticus.fandom.com/wiki/Tournament_Arena")
  })

  it("returns undefined for a definition without a wiki article", () => {
    expect(resolveEventWikiUrl("hse-warp-surge")).toBeUndefined()
    expect(resolveEventWikiUrl("crusade-season")).toBeUndefined()
  })
})
