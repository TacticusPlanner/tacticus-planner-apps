import { describe, expect, it } from "vitest"

import { selectHreInstance } from "./hre-instance"
import { HRE_MISSIONS, hreMission } from "./hre-missions"
import {
  nextTokenReserve,
  remainingCampaignBattles,
  selectCampaignPlan,
  tokenNeedRows,
  tokenNeeds,
} from "./hre-objectives"
import { arenaSurplus, selectTeamPlans } from "./hre-team-plan"
import { bracketForRank, bracketRange, projectHrePace } from "./hre-pace"
import {
  advanceMission,
  DEFAULT_HRE_PROGRESS,
  HRE_ALL_DONE,
  isMissionComplete,
  parseHreProgress,
  type HreProgress,
} from "./hre-progress"

const DAY_MS = 86_400_000
const definitions = new Map([
  ["new-character-event", { type: "NewCharacterEvent" }],
  ["home-screen-event", { type: "HomeScreenEvent" }],
])
const zapspitta = {
  occurrenceId: "occ-zapspitta",
  definitionId: "new-character-event",
  startUtc: "2026-10-18T00:00:00Z",
  endUtc: "2026-11-01T00:00:00Z",
  parameters: { featuredCharacterId: "orksWeirdboy" },
}
const later = {
  occurrenceId: "occ-later",
  definitionId: "new-character-event",
  startUtc: "2026-12-06T00:00:00Z",
  endUtc: "2026-12-20T00:00:00Z",
  parameters: {},
}
const hse = {
  ...zapspitta,
  occurrenceId: "occ-hse",
  definitionId: "home-screen-event",
}

const at = (iso: string) => Date.parse(iso)
const progress = (overrides: Partial<HreProgress> = {}): HreProgress => ({
  ...DEFAULT_HRE_PROGRESS,
  ...overrides,
})

describe("selectHreInstance", () => {
  it("picks the running HRE, start inclusive", () => {
    const instance = selectHreInstance(
      [later, hse, zapspitta],
      definitions,
      at(zapspitta.startUtc)
    )
    expect(instance?.key).toBe("occ-zapspitta")
    expect(instance?.status).toBe("running")
    expect(instance?.featuredCharacterId).toBe("orksWeirdboy")
  })

  it("previews the next HRE once the window ends (end exclusive)", () => {
    const instance = selectHreInstance(
      [zapspitta, later],
      definitions,
      at(zapspitta.endUtc)
    )
    expect(instance?.key).toBe("occ-later")
    expect(instance?.status).toBe("upcoming")
    expect(instance?.featuredCharacterId).toBeNull()
  })

  it("resolves overlapping HREs to the latest start", () => {
    const overlap = {
      ...zapspitta,
      occurrenceId: "occ-b",
      startUtc: "2026-10-20T00:00:00Z",
    }
    const instance = selectHreInstance(
      [zapspitta, overlap],
      definitions,
      at("2026-10-21T00:00:00Z")
    )
    expect(instance?.key).toBe("occ-b")
  })

  it("keys an entry without occurrence id by definition and start", () => {
    const entry = { ...zapspitta, occurrenceId: null }
    expect(
      selectHreInstance([entry], definitions, at("2026-10-19T00:00:00Z"))?.key
    ).toBe("new-character-event@2026-10-18T00:00:00Z")
  })

  it("returns none when no HRE runs or is upcoming", () => {
    expect(
      selectHreInstance([hse], definitions, at("2026-10-19T00:00:00Z"))
    ).toBeNull()
  })
})

describe("missions", () => {
  it("has 20 missions plus the Bonus, two objectives each", () => {
    expect(HRE_MISSIONS).toHaveLength(21)
    expect(
      HRE_MISSIONS.every((mission) => mission.objectives.length === 2)
    ).toBe(true)
  })

  it("clamps the mission number into range", () => {
    expect(hreMission(0).number).toBe(1)
    expect(hreMission(99).number).toBe(21)
  })
})

describe("progress", () => {
  it("drops invalid entries and clamps progress to the targets", () => {
    expect(parseHreProgress("x")).toBeNull()
    expect(parseHreProgress({ mission: 0 })).toBeNull()
    expect(parseHreProgress({ mission: 23 })).toBeNull()
    expect(
      parseHreProgress({ mission: 5, progress: [-3, 500] })?.progress
    ).toEqual([0, 100])
  })

  it("swaps progress stored before the objectives moved to the game's order", () => {
    // Mission 7 was Salvage Runs then alliance ability uses; it is now the reverse.
    expect(
      parseHreProgress({ mission: 7, progress: [2, 12] })?.progress
    ).toEqual([12, 2])
    expect(
      parseHreProgress({ mission: 7, progress: [12, 2], order: 2 })?.progress
    ).toEqual([12, 2])
    expect(
      parseHreProgress({ mission: 5, progress: [0, 37] })?.progress
    ).toEqual([0, 37])
  })

  it("keeps points, rank and target", () => {
    expect(
      parseHreProgress({
        mission: 5,
        progress: [0, 37],
        points: 14_500,
        rank: 3200,
        target: "epic-red-1",
      })
    ).toEqual({
      mission: 5,
      progress: [0, 37],
      points: 14_500,
      rank: 3200,
      target: "epic-red-1",
    })
  })

  it("completes and advances a mission", () => {
    const done = progress({ mission: 5, progress: [10_000, 100] })
    expect(isMissionComplete(done)).toBe(true)
    expect(advanceMission(done)).toMatchObject({ mission: 6, progress: [0, 0] })
    expect(advanceMission(progress({ mission: 21 })).mission).toBe(HRE_ALL_DONE)
  })
})

describe("objectives", () => {
  it("selects mission 5's campaign wins with 63 to go, and its ability damage open-ended", () => {
    expect(
      selectCampaignPlan(progress({ mission: 5, progress: [0, 37] }))
    ).toMatchObject({
      missionNumber: 5,
      raids: { battlesToGo: 63, eventOnly: false },
      battles: {
        needs: [{ objective: { kind: "abilityDamage" }, per: null }],
        countsAsWins: true,
      },
    })
  })

  it("serves lightning victories from event nodes only", () => {
    expect(
      selectCampaignPlan(progress({ mission: 11, progress: [5, 100] }))
    ).toMatchObject({
      raids: { battlesToGo: 20, eventOnly: true },
      battles: null,
    })
  })

  it("has no plan once nothing campaign-related is open", () => {
    expect(
      selectCampaignPlan(progress({ mission: 5, progress: [10_000, 100] }))
    ).toBeNull()
    expect(
      selectCampaignPlan(progress({ mission: 8, progress: [0, 20_000] }))
    ).toBeNull()
  })

  it("never keeps raids to the alliance's nodes: raids count no kills or ability uses", () => {
    for (const mission of [2, 16, 20, 21]) {
      const plan = selectCampaignPlan(progress({ mission }))
      expect(plan?.raids).not.toHaveProperty("alliance")
      expect(plan?.battles?.alliance).toBe(true)
    }
    expect(selectCampaignPlan(progress({ mission: 2 }))?.battles).toMatchObject(
      { countsAsWins: false, needs: [{ toGo: 10, per: "enemies" }] }
    )
    expect(
      selectCampaignPlan(progress({ mission: 20 }))?.battles
    ).toMatchObject({
      countsAsWins: true,
      needs: [{ toGo: 10, per: "battle" }],
    })
  })

  it("serves all-alliance wins as battles fought by hand on the alliance's nodes", () => {
    expect(
      selectCampaignPlan(progress({ mission: 10, progress: [5, 0] }))
    ).toMatchObject({
      raids: null,
      battles: {
        needs: [{ toGo: 10, per: "battle" }],
        alliance: true,
        countsAsWins: false,
      },
    })
    expect(
      selectCampaignPlan(progress({ mission: 10 }))?.battles?.slots
    ).toBeUndefined()
  })

  it("serves ability uses as battles fought by hand on 5-slot nodes", () => {
    for (const mission of [3, 7, 13, 15]) {
      expect(selectCampaignPlan(progress({ mission }))?.battles).toMatchObject({
        slots: 5,
      })
    }
    expect(selectCampaignPlan(progress({ mission: 15 }))).toMatchObject({
      raids: null,
      battles: { needs: [{ toGo: 150, per: "abilityUses" }], alliance: false },
    })
    expect(selectCampaignPlan(progress({ mission: 3 }))).toMatchObject({
      raids: { battlesToGo: 20 },
      battles: {
        needs: [{ toGo: 30, per: "abilityUses" }],
        countsAsWins: true,
      },
    })
  })

  it("keeps featured-hero battles to the hero's faction's nodes, and only those", () => {
    expect(
      selectCampaignPlan(progress({ mission: 20 }))?.battles
    ).toMatchObject({ alliance: true, featured: true })
    expect(
      selectCampaignPlan(progress({ mission: 13 }))?.battles
    ).toMatchObject({ featured: false })
  })

  it("combines mission 13's kills and alliance ability uses in one list", () => {
    expect(
      selectCampaignPlan(progress({ mission: 13 }))?.battles
    ).toMatchObject({
      needs: [
        { toGo: 75, per: "enemies" },
        { toGo: 50, per: "abilityUses" },
      ],
      slots: 5,
      alliance: true,
    })
  })

  it("lists Necron nodes while mission 11's Necron kills are open, lightning nodes first", () => {
    expect(
      selectCampaignPlan(progress({ mission: 11, progress: [0, 40] }))
    ).toMatchObject({
      raids: { eventOnly: true },
      battles: {
        needs: [{ toGo: 60, per: "factionEnemies" }],
        faction: "Necrons",
        preferLightning: true,
      },
    })
    expect(
      selectCampaignPlan(progress({ mission: 11, progress: [25, 40] }))
    ).toMatchObject({
      raids: null,
      battles: { faction: "Necrons", preferLightning: false },
    })
  })

  it("leaves mission 6's summon-free wins the Arena surplus can play", () => {
    expect(
      selectCampaignPlan(progress({ mission: 6 }), 3)?.battles?.needs
    ).toMatchObject([
      { objective: { kind: "heal" }, per: null },
      { objective: { kind: "winWithoutSummons" }, toGo: 7 },
    ])
    expect(
      selectCampaignPlan(progress({ mission: 6, progress: [2500, 0] }), 12)
    ).toBeNull()
  })

  it("counts the 663 campaign battles left from mission 5 at 37/100", () => {
    expect(
      remainingCampaignBattles(progress({ mission: 5, progress: [0, 37] }))
    ).toBe(663)
  })

  it("adds up day-1 token needs", () => {
    expect(tokenNeeds(progress())).toEqual({
      arena: 12,
      guildRaid: 2,
      onslaught: 1,
      salvageRun: 2,
    })
  })

  it("reduces the need by the current mission's progress", () => {
    expect(tokenNeeds(progress({ mission: 4, progress: [3, 0] })).arena).toBe(9)
  })

  it("marks short and not-unlocked modes", () => {
    const rows = tokenNeedRows(progress(), {
      arena: 8,
      guildRaid: 2,
      onslaught: null,
      salvageRun: 5,
    })
    expect(rows).toEqual([
      { mode: "arena", need: 12, have: 8, short: true },
      { mode: "guildRaid", need: 2, have: 2, short: false },
      { mode: "onslaught", need: 1, have: null, short: false },
      { mode: "salvageRun", need: 2, have: 5, short: false },
    ])
  })

  it("hides modes with nothing left to do", () => {
    expect(
      tokenNeedRows(progress({ mission: 16 }), {
        arena: 0,
        guildRaid: 0,
        onslaught: 0,
        salvageRun: 0,
      })
    ).toEqual([])
  })
})

describe("projectHrePace", () => {
  const start = at(zapspitta.startUtc)
  const end = at(zapspitta.endUtc)
  const base = {
    points: 30_000,
    rank: 3200,
    startMs: start,
    endMs: end,
    nowMs: end,
    startRarity: "Common",
    target: null,
  }

  it("follows the 30,000-point worked example to Epic 1 red star", () => {
    const pace = projectHrePace(base)
    expect(pace.projectedPoints).toBe(30_000)
    expect(pace.currency).toEqual({
      milestones: 3450,
      missions: 2000,
      daily: 826,
      crates: 720,
      total: 6996,
    })
    expect(pace.chest.tier).toBe(21)
    expect(pace.shards).toEqual({ chests: 438, crates: 42, total: 480 })
    expect(pace.reached?.id).toBe("epic-red-1")
    expect(pace.next?.id).toBe("epic-red-2")
  })

  it("needs 28,000 points for the Epic target", () => {
    const pace = projectHrePace({ ...base, target: "epic-red-1" })
    expect(pace.target).toMatchObject({
      chestTier: 21,
      currency: 6750,
      points: 28_000,
      reached: true,
      margin: 2000,
    })
  })

  it("needs 2,000 points a day for Epic from 0 points on day 1", () => {
    const pace = projectHrePace({
      ...base,
      points: 0,
      nowMs: start,
      target: "epic-red-1",
    })
    expect(pace.target).toMatchObject({
      chestShards: 418,
      milestoneCurrency: 3204,
      points: 28_000,
      pointsPerDay: 2000,
    })
  })

  it("projects the day-7 pace and the points per day a target needs", () => {
    const pace = projectHrePace({
      ...base,
      points: 14_500,
      nowMs: start + 7 * DAY_MS,
      target: "epic-red-2",
    })
    expect(pace.averagePerDay).toBe(2071)
    expect(pace.projectedPoints).toBe(29_000)
    expect(pace.target?.reached).toBe(false)
    expect(pace.target?.pointsPerDay).toBe(
      Math.ceil(((pace.target?.points ?? 0) - 14_500) / 7)
    )
  })

  it("flags Oh So Close when the next step is 25 shards away or less", () => {
    // No rank: lowest bracket, 7,185 currency, tier 21 and 9 crate shards make 447, 13 short of Epic.
    const near = projectHrePace({ ...base, rank: null, points: 50_000 })
    expect(near.rankKnown).toBe(false)
    expect(near.shards.total).toBe(447)
    expect(near.shortOfNext).toBe(13)
    expect(near.ohSoClose).toBe(true)
    expect(projectHrePace(base).ohSoClose).toBe(false)
  })

  it("starts the steps at the hero's unlock rarity", () => {
    const pace = projectHrePace({
      ...base,
      points: 0,
      rank: null,
      startRarity: "Rare",
    })
    expect(pace.next?.id).toBe("rare-4")
  })
})

describe("selectTeamPlans", () => {
  const modes = (state: HreProgress, surplus = 0) =>
    selectTeamPlans(state, surplus).map((plan) => `${plan.mode}:${plan.rule}`)

  it("gives the manual objectives one campaign team with the strictest rule", () => {
    expect(modes(progress({ mission: 14 }))).toEqual(["battle:alliance"])
    expect(modes(progress({ mission: 20 }))).toEqual(["battle:featured"])
    expect(modes(progress({ mission: 21 }))).toEqual(["battle:featured"])
    expect(modes(progress({ mission: 13 }))).toEqual(["battle:alliance"])
    expect(modes(progress({ mission: 17 }))).toEqual(["battle:strongest"])
    expect(modes(progress({ mission: 19 }))).toEqual(["battle:melee"])
    expect(modes(progress({ mission: 5, progress: [10_000, 0] }))).toEqual([])
  })

  it("gives every open token objective a team in its mode with the partner's rule", () => {
    expect(modes(progress({ mission: 4 }))).toEqual([
      "battle:ranged",
      "arena:ranged",
    ])
    expect(modes(progress({ mission: 7 }))).toEqual([
      "battle:alliance",
      "salvageRun:alliance",
    ])
    expect(modes(progress({ mission: 8 }))).toEqual([
      "battle:strongest",
      "guildRaid:strongest",
    ])
    expect(modes(progress({ mission: 10 }))).toEqual([
      "battle:alliance",
      "arena:alliance",
    ])
    expect(modes(progress({ mission: 12 }))).toEqual([
      "battle:strongest",
      "onslaught:strongest",
    ])
    expect(
      selectTeamPlans(progress({ mission: 12 })).every((plan) => plan.support)
    ).toBe(true)
    expect(modes(progress({ mission: 8, progress: [0, 20_000] }))).toEqual([
      "guildRaid:strongest",
    ])
  })

  it("keeps the Onslaught pool for ranged kills without Arena and for any-unit ability uses", () => {
    expect(modes(progress({ mission: 4, progress: [4, 0] }))).toEqual([
      "battle:ranged",
      "onslaught:ranged",
    ])
    expect(modes(progress({ mission: 3 }))).toEqual([
      "battle:abilities",
      "onslaught:abilities",
    ])
    expect(modes(progress({ mission: 15 }))).toEqual([
      "battle:abilities",
      "arena:abilities",
      "onslaught:abilities",
    ])
    expect(selectTeamPlans(progress({ mission: 9 }))[1]).toMatchObject({
      mode: "onslaught",
      size: 8,
      preferPsychic: true,
      reserve: { tokens: 1, missionNumber: 12 },
    })
    expect(
      selectTeamPlans(progress({ mission: 9, progress: [7500, 0] }))[0]
        ?.preferPsychic
    ).toBe(false)
  })

  it("plays mission 6 in Arena only with tokens above mission 10's reserve", () => {
    expect(modes(progress({ mission: 6 }))).toEqual(["battle:summonFree"])
    expect(modes(progress({ mission: 6 }), 2)).toEqual([
      "battle:summonFree",
      "arena:summonFree",
    ])
    expect(selectTeamPlans(progress({ mission: 6 }), 2)[1]).toMatchObject({
      support: true,
      reserve: { tokens: 4, missionNumber: 10 },
    })
    expect(arenaSurplus(progress({ mission: 6 }), 7)).toBe(3)
    expect(arenaSurplus(progress({ mission: 6 }), 3)).toBe(0)
    expect(arenaSurplus(progress({ mission: 6 }), null)).toBe(0)
  })
})

describe("tips", () => {
  it("names the next token mission's reserve, never the current one's", () => {
    expect(nextTokenReserve(1)).toEqual({
      mode: "arena",
      tokens: 4,
      missionNumber: 4,
    })
    expect(nextTokenReserve(7)).toEqual({
      mode: "guildRaid",
      tokens: 2,
      missionNumber: 8,
    })
    expect(nextTokenReserve(15)).toBeNull()
  })
})

describe("brackets", () => {
  it("resolves rank 3,200 to the 2,501 to 5,000 bracket and no rank to the last", () => {
    expect(bracketRange(bracketForRank(3200))).toEqual({ from: 2501, to: 5000 })
    expect(bracketRange(bracketForRank(null))).toEqual({
      from: 200_001,
      to: null,
    })
    expect(bracketRange(bracketForRank(1))).toEqual({ from: 1, to: 1 })
  })
})
