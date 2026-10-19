import { describe, expect, it } from "vitest"

import { selectHreInstance } from "./hre-instance"
import { HRE_MISSIONS, hreMission } from "./hre-missions"
import {
  remainingCampaignBattles,
  selectRaidObjective,
  selectTeamObjective,
  tokenNeedRows,
  tokenNeeds,
} from "./hre-objectives"
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
  it("selects mission 5's campaign wins with 63 to go", () => {
    expect(
      selectRaidObjective(progress({ mission: 5, progress: [0, 37] }))
    ).toMatchObject({
      missionNumber: 5,
      battlesToGo: 63,
      eventOnly: false,
    })
  })

  it("serves lightning victories from event nodes only", () => {
    expect(
      selectRaidObjective(progress({ mission: 11, progress: [5, 0] }))
    ).toMatchObject({
      battlesToGo: 20,
      eventOnly: true,
    })
  })

  it("has no raid objective once it is met or the mission has none", () => {
    expect(
      selectRaidObjective(progress({ mission: 5, progress: [0, 100] }))
    ).toBeNull()
    expect(selectRaidObjective(progress({ mission: 4 }))).toBeNull()
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

describe("selectTeamObjective", () => {
  it("names the lineup rule of the current mission's open objective", () => {
    expect(selectTeamObjective(progress({ mission: 14 }))?.rule).toBe(
      "alliance"
    )
    expect(selectTeamObjective(progress({ mission: 6 }))?.rule).toBe(
      "summonFree"
    )
    expect(selectTeamObjective(progress({ mission: 20 }))?.rule).toBe(
      "featured"
    )
    expect(selectTeamObjective(progress({ mission: 21 }))?.rule).toBe(
      "featured"
    )
    expect(
      selectTeamObjective(progress({ mission: 6, progress: [0, 10] }))
    ).toBeNull()
    expect(selectTeamObjective(progress({ mission: 5 }))).toBeNull()
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
