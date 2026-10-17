import { describe, expect, it } from "vitest"

import { npcLibraryHref } from "./library-href"
import { npcRecord, statRow, zeroRow } from "./npc-fixtures"

describe("npcLibraryHref", () => {
  it("links a listed variation at a level", () => {
    const grot = npcRecord("orksNpc1Grot", "Grot", { stats: [statRow(0, 0)] })
    expect(npcLibraryHref(grot, 3)).toBe(
      "/library/npcs/grot?variation=orksNpc1Grot&level=3"
    )
  })

  it("omits the level when none is given", () => {
    const boy = npcRecord("orksNpc2OrkBoy", "Ork Boy", {
      stats: [statRow(0, 0)],
    })
    expect(npcLibraryHref(boy)).toBe(
      "/library/npcs/ork-boy?variation=orksNpc2OrkBoy"
    )
  })

  it("is undefined for a variation the Library does not list", () => {
    expect(
      npcLibraryHref(
        npcRecord("deathNpcMoWCrawler", "Crawler", {
          kind: "machineOfWar",
          stats: [statRow(0, 0)],
        })
      )
    ).toBeUndefined()
    expect(
      npcLibraryHref(npcRecord("genesDecoy", "Decoy", { stats: [zeroRow] }))
    ).toBeUndefined()
  })
})
