import { describe, expect, it } from "vitest"
import { guildWarFixture } from "@workspace/game-catalog/testing"

import { historyTotals } from "./history-totals"
import type { GuildWar, GuildWarAttack } from "./types"

const lineupUnit = (unitId: string) => ({
  unitId,
  progression: "Legendary:RedFiveStars" as const,
  rank: "Diamond3" as const,
  xpLevel: 50,
  abilityLevels: [40, 35],
})

const enemy = (unitId: string) => ({
  unitId,
  rarity: null,
  rank: null,
  state: null,
})

let next = 0
const attack = (
  zoneId: string,
  result: GuildWarAttack["result"],
  rarityCap: GuildWarAttack["rarityCap"],
  characters = ["a", "b"]
): GuildWarAttack => ({
  id: `attack-${(next += 1)}`,
  revision: 1,
  attackedAt: "2026-11-21T10:00:00Z",
  zoneId,
  slot: 0,
  rarityCap,
  characters: characters.map(lineupUnit),
  mow: null,
  result,
  lostUnitIds: result === "won" ? ["b"] : null,
  notes: null,
  enemy:
    result === "lost"
      ? {
          characters: [enemy("x"), enemy("y")],
          mow: null,
          buffIds: [],
          boardId: null,
        }
      : null,
})

const war = (
  battlefieldLevel: number,
  attacks: GuildWarAttack[]
): GuildWar => ({
  id: `war-${battlefieldLevel}`,
  revision: 1,
  seasonId: "guildWarSeasonA",
  battlefieldLevel,
  startedAt: "2026-11-20T10:00:00Z",
  endedAt: "2026-11-22T10:00:00Z",
  tokensUsed: attacks.length,
  deployedUnitIds: [],
  attacks,
})

describe("historyTotals", () => {
  it("rates zone tiers at each war's level and slot rarities, counting decided attacks", () => {
    const totals = historyTotals(
      [
        // Level 5: Armoury is Elite, Trenches1 Veteran.
        war(5, [
          attack("Armoury", "won", "Epic"),
          attack("Armoury", "lost", "Legendary", ["c"]),
          attack("Trenches1", null, "Rare"),
        ]),
        // Level 0: Trenches1 is Hero.
        war(0, [attack("Trenches1", "won", "Mythic")]),
      ],
      guildWarFixture
    )
    expect(totals.byTier).toEqual([
      { key: "Elite", won: 1, decided: 2 },
      { key: "Hero", won: 1, decided: 1 },
    ])
    expect(totals.byRarity.map((rate) => rate.key)).toEqual([
      "Mythic",
      "Legendary",
      "Epic",
    ])
    expect(totals.lineups).toEqual([
      { key: "a,b", characterIds: ["a", "b"], count: 3, won: 2, decided: 2 },
    ])
  })

  it("counts the overall results, zones, characters and the enemies lost to", () => {
    const totals = historyTotals(
      [
        war(5, [
          attack("Armoury", "won", "Epic", ["b", "a"]),
          attack("Armoury", "lost", "Epic", ["c"]),
          attack("HQ", null, "Epic"),
        ]),
        war(4, [attack("Armoury", "lost", "Epic", ["c", "a"])]),
      ],
      guildWarFixture
    )
    expect(totals.overall).toEqual({
      attacks: 4,
      won: 1,
      lost: 2,
      unitsLost: 1,
    })
    expect(totals.byZone).toEqual([{ key: "Armoury", won: 1, decided: 3 }])
    expect(totals.characters.slice(0, 2)).toEqual([
      { key: "a", won: 1, decided: 2, count: 3 },
      { key: "b", won: 1, decided: 1, count: 2 },
    ])
    // The lineup keeps the order it was first logged in.
    expect(totals.lineups[0]?.characterIds).toEqual(["b", "a"])
    expect(totals.enemies).toEqual([
      { key: "x", count: 2 },
      { key: "y", count: 2 },
    ])
  })
})
