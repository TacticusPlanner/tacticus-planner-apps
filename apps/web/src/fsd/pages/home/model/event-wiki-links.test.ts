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
    expect(resolveEventWikiUrl("hse-terminator-boost")).toBeUndefined()
    expect(resolveEventWikiUrl("crusade-season")).toBeUndefined()
  })

  it("returns a wiki URL for HSEs and Double XP with known articles", () => {
    expect(resolveEventWikiUrl("hse-warp-surge")).toBe(
      "https://tacticus.wiki.gg/wiki/Warp_Surge"
    )
    expect(resolveEventWikiUrl("hse-faction-boost")).toBe(
      "https://tacticus.wiki.gg/wiki/Faction_Boost"
    )
    expect(resolveEventWikiUrl("hse-faction-focus")).toBe(
      "https://tacticus.wiki.gg/wiki/Faction_Focus"
    )
    expect(resolveEventWikiUrl("hse-training-rush")).toBe(
      "https://tacticus.wiki.gg/wiki/Training_Rush"
    )
    expect(resolveEventWikiUrl("hse-global-conflict-operations")).toBe(
      "https://tacticus.wiki.gg/wiki/Conflict_Operations"
    )
    expect(resolveEventWikiUrl("hse-arsenal-of-war")).toBe(
      "https://tacticus.wiki.gg/wiki/Arsenal_of_War"
    )
    expect(resolveEventWikiUrl("hse-machine-hunt")).toBe(
      "https://tacticus.wiki.gg/wiki/Machine_Hunt"
    )
    expect(resolveEventWikiUrl("always-double-xp-sunday")).toBe(
      "https://tacticus.fandom.com/wiki/HDTW_XP"
    )
  })
})
