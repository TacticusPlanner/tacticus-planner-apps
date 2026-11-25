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
  unitsLost: null,
  enemy: null,
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
    expect(totals.lineups).toEqual([{ characterIds: ["a", "b"], count: 3 }])
  })
})
