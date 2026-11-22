import { describe, expect, it } from "vitest"

import {
  listHreInstances,
  resolveHreSelection,
  selectHreInstance,
} from "./hre-instance"
import { hreRules, hreMissions } from "@/test/fixtures/hre-rules"

import { hreAllDone, hreMission } from "./hre-missions"
import {
  nextTokenReserve,
  remainingCampaignBattles,
  selectCampaignPlan,
  spareTokens,
  tokenNeedRows,
  tokenNeeds,
} from "./hre-objectives"
import type { HreSpareTokens } from "./hre-objectives"
import { selectTeamPlans } from "./hre-team-plan"
import {
  bracketForRank,
  bracketRange,
  calendarDaysBetween,
  ownedFrom,
  projectHrePace,
} from "./hre-pace"
import {
  advanceMission,
  DEFAULT_HRE_PROGRESS,
  isMissionComplete,
  normalizeHreProgress,
  parseHreProgress,
} from "./hre-progress"
import type { HreProgress } from "./hre-progress"

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

describe("listHreInstances", () => {
  const nowMs = at("2026-11-10T00:00:00Z")
  const instances = listHreInstances(
    [later, hse, zapspitta, zapspitta],
    definitions,
    nowMs
  )

  it("lists each HRE once, by start, with its status", () => {
    expect(
      instances.map((instance) => [instance.key, instance.status])
    ).toEqual([
      ["occ-zapspitta", "past"],
      ["occ-later", "upcoming"],
    ])
  })

  it("resolves a requested key, else the default, and flags a stale key", () => {
    const fallback = selectHreInstance([later, zapspitta], definitions, nowMs)
    expect(resolveHreSelection(instances, fallback, null)).toMatchObject({
      instance: { key: "occ-later" },
      stale: false,
    })
    expect(
      resolveHreSelection(instances, fallback, "occ-zapspitta")
    ).toMatchObject({
      instance: { key: "occ-zapspitta", status: "past" },
      defaultInstance: { key: "occ-later" },
      stale: false,
    })
    expect(resolveHreSelection(instances, fallback, "gone")).toMatchObject({
      instance: { key: "occ-later" },
      stale: true,
    })
  })
})

describe("missions", () => {
  it("has 20 missions plus the Bonus, two objectives each", () => {
    expect(hreMissions).toHaveLength(21)
    // The type is a pair; the bundled data is what this checks.
    expect(hreMissions.map((mission) => mission.objectives.length)).toEqual(
      Array.from({ length: 21 }, () => 2)
    )
  })

  it("clamps the mission number into range", () => {
    expect(hreMission(hreMissions, 0).number).toBe(1)
    expect(hreMission(hreMissions, 99).number).toBe(21)
  })
})

describe("progress", () => {
  it("drops invalid entries", () => {
    expect(parseHreProgress("x")).toBeNull()
    expect(parseHreProgress({ mission: 0 })).toBeNull()
    expect(
      parseHreProgress({ mission: 5, progress: [-3, 500] })?.progress
    ).toEqual([0, 500])
  })

  it("fits a stored entry to the served missions", () => {
    const stored = parseHreProgress({
      mission: 5,
      progress: [-3, 500],
      byMission: { 4: [9, 99], 30: [1, 1] },
    })!
    expect(normalizeHreProgress(stored, hreMissions)).toMatchObject({
      mission: 5,
      progress: [0, 100],
      byMission: { 4: [4, 50] },
    })
    expect(
      normalizeHreProgress(progress({ mission: 23 }), hreMissions).mission
    ).toBe(hreAllDone(hreMissions))
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
      ...DEFAULT_HRE_PROGRESS,
      mission: 5,
      progress: [0, 37],
      points: 14_500,
      rank: 3200,
      target: "epic-red-1",
    })
  })

  it("completes and advances a mission", () => {
    const done = progress({ mission: 5, progress: [10_000, 100] })
    expect(isMissionComplete(done, hreMissions)).toBe(true)
    expect(advanceMission(done, hreMissions)).toMatchObject({
      mission: 6,
      progress: [0, 0],
    })
    expect(advanceMission(progress({ mission: 21 }), hreMissions).mission).toBe(
      hreAllDone(hreMissions)
    )
  })

  it("completes a mission at any progress, keeping it at its targets", () => {
    const partial = progress({ mission: 5, progress: [1200, 0] })
    expect(isMissionComplete(partial, hreMissions)).toBe(false)
    const next = advanceMission(partial, hreMissions)
    expect(next).toMatchObject({ mission: 6, progress: [0, 0] })
    expect(next.byMission[5]).toEqual([10_000, 100])
  })
})

describe("objectives", () => {
  it("selects mission 5's campaign wins with 63 to go, and its ability damage open-ended", () => {
    expect(
      selectCampaignPlan(
        progress({ mission: 5, progress: [0, 37] }),
        hreMissions
      )
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
      selectCampaignPlan(
        progress({ mission: 11, progress: [5, 100] }),
        hreMissions
      )
    ).toMatchObject({
      raids: { battlesToGo: 20, eventOnly: true },
      battles: null,
    })
  })

  it("has no plan once nothing campaign-related is open", () => {
    expect(
      selectCampaignPlan(
        progress({ mission: 5, progress: [10_000, 100] }),
        hreMissions
      )
    ).toBeNull()
    expect(
      selectCampaignPlan(
        progress({ mission: 8, progress: [0, 20_000] }),
        hreMissions
      )
    ).toBeNull()
  })

  it("never keeps raids to the alliance's nodes: raids count no kills or ability uses", () => {
    for (const mission of [2, 16, 20, 21]) {
      const plan = selectCampaignPlan(progress({ mission }), hreMissions)
      expect(plan?.raids).not.toHaveProperty("alliance")
      expect(plan?.battles?.alliance).toBe(true)
    }
    expect(
      selectCampaignPlan(progress({ mission: 2 }), hreMissions)?.battles
    ).toMatchObject({
      countsAsWins: false,
      needs: [{ toGo: 10, per: "enemies" }],
    })
    expect(
      selectCampaignPlan(progress({ mission: 20 }), hreMissions)?.battles
    ).toMatchObject({
      countsAsWins: true,
      needs: [{ toGo: 10, per: "battle" }],
    })
  })

  it("serves all-alliance wins as battles fought by hand on the alliance's nodes", () => {
    expect(
      selectCampaignPlan(
        progress({ mission: 10, progress: [5, 0] }),
        hreMissions
      )
    ).toMatchObject({
      raids: null,
      battles: {
        needs: [{ toGo: 10, per: "battle" }],
        alliance: true,
        countsAsWins: false,
      },
    })
    expect(
      selectCampaignPlan(progress({ mission: 10 }), hreMissions)?.battles?.slots
    ).toBeUndefined()
  })

  it("serves ability uses as battles fought by hand on 5-slot nodes", () => {
    for (const mission of [3, 7, 13, 15]) {
      expect(
        selectCampaignPlan(progress({ mission }), hreMissions)?.battles
      ).toMatchObject({
        slots: 5,
      })
    }
    expect(
      selectCampaignPlan(progress({ mission: 15 }), hreMissions)
    ).toMatchObject({
      raids: null,
      battles: { needs: [{ toGo: 150, per: "abilityUses" }], alliance: false },
    })
    expect(
      selectCampaignPlan(progress({ mission: 3 }), hreMissions)
    ).toMatchObject({
      raids: { battlesToGo: 20 },
      battles: {
        needs: [{ toGo: 30, per: "abilityUses" }],
        countsAsWins: true,
      },
    })
  })

  it("keeps featured-hero battles to the hero's faction's nodes, and only those", () => {
    expect(
      selectCampaignPlan(progress({ mission: 20 }), hreMissions)?.battles
    ).toMatchObject({ alliance: true, featured: true })
    expect(
      selectCampaignPlan(progress({ mission: 13 }), hreMissions)?.battles
    ).toMatchObject({ featured: false })
  })

  it("combines mission 13's kills and alliance ability uses in one list", () => {
    expect(
      selectCampaignPlan(progress({ mission: 13 }), hreMissions)?.battles
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
      selectCampaignPlan(
        progress({ mission: 11, progress: [0, 40] }),
        hreMissions
      )
    ).toMatchObject({
      raids: { eventOnly: true },
      battles: {
        needs: [{ toGo: 60, per: "factionEnemies" }],
        faction: "Necrons",
        preferLightning: true,
      },
    })
    expect(
      selectCampaignPlan(
        progress({ mission: 11, progress: [25, 40] }),
        hreMissions
      )
    ).toMatchObject({
      raids: null,
      battles: { faction: "Necrons", preferLightning: false },
    })
  })

  it("leaves mission 6's summon-free wins the Arena surplus can play", () => {
    expect(
      selectCampaignPlan(progress({ mission: 6 }), hreMissions, 3)?.battles
        ?.needs
    ).toMatchObject([
      { objective: { kind: "heal" }, per: null },
      { objective: { kind: "winWithoutSummons" }, toGo: 7 },
    ])
    expect(
      selectCampaignPlan(
        progress({ mission: 6, progress: [2500, 0] }),
        hreMissions,
        12
      )
    ).toBeNull()
  })

  it("counts the 663 campaign battles left from mission 5 at 37/100", () => {
    expect(
      remainingCampaignBattles(
        progress({ mission: 5, progress: [0, 37] }),
        hreMissions
      )
    ).toBe(663)
  })

  it("adds up day-1 token needs", () => {
    expect(tokenNeeds(progress(), hreMissions)).toEqual({
      arena: 12,
      guildRaid: 2,
      onslaught: 1,
      salvageRun: 2,
    })
  })

  it("reduces the need by the current mission's progress", () => {
    expect(
      tokenNeeds(progress({ mission: 4, progress: [3, 0] }), hreMissions).arena
    ).toBe(9)
  })

  it("marks short and not-unlocked modes", () => {
    const rows = tokenNeedRows(progress(), hreMissions, {
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
      tokenNeedRows(progress({ mission: 16 }), hreMissions, {
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
    const pace = projectHrePace(hreRules.rewards, base)
    expect(pace.projectedPoints).toBe(30_000)
    expect(pace.currency).toEqual({
      owned: null,
      milestones: 3450,
      missions: 2000,
      daily: 826,
      crates: 720,
      total: 6996,
    })
    expect(pace.chest).toEqual({ from: 1, tier: 21, spent: 6750, left: 246 })
    expect(pace.shards).toEqual({
      held: null,
      chests: 438,
      crates: 42,
      total: 480,
    })
    expect(pace.reached?.id).toBe("epic-red-1")
    expect(pace.next?.id).toBe("epic-red-2")
  })

  it("needs 28,000 points for the Epic target", () => {
    const pace = projectHrePace(hreRules.rewards, {
      ...base,
      target: "epic-red-1",
    })
    expect(pace.target).toMatchObject({
      chestTier: 21,
      currency: 6750,
      points: 28_000,
      reached: true,
      margin: 2000,
    })
  })

  it("needs 2,000 points a day for Epic from 0 points on day 1", () => {
    const pace = projectHrePace(hreRules.rewards, {
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
    const pace = projectHrePace(hreRules.rewards, {
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
    const near = projectHrePace(hreRules.rewards, {
      ...base,
      rank: null,
      points: 50_000,
    })
    expect(near.rankKnown).toBe(false)
    expect(near.shards.total).toBe(447)
    expect(near.shortOfNext).toBe(13)
    expect(near.ohSoClose).toBe(true)
    expect(projectHrePace(hreRules.rewards, base).ohSoClose).toBe(false)
  })

  it("gives the same result within one milestone band", () => {
    for (const [points, days] of [
      [7464, 3.67],
      [15_657, 7.35],
    ] as const) {
      const pace = projectHrePace(hreRules.rewards, {
        ...base,
        points,
        rank: 26_602,
        nowMs: start + days * DAY_MS,
      })
      expect(pace.projectedPoints).toBeGreaterThanOrEqual(28_000)
      expect(pace.projectedPoints).toBeLessThan(30_000)
      expect(pace.currency).toMatchObject({
        milestones: 3240,
        missions: 2000,
        daily: 616,
        crates: 510,
        total: 6366,
      })
      expect(pace.chest.tier).toBe(20)
      expect(pace.shards.total).toBe(431)
      expect(pace.nextMilestone?.points).toBeGreaterThan(points)
    }
  })

  describe("from what the player holds", () => {
    // Day 8 of Zapspitta's event: 15,657 points at 7.0 days, rank 26,602 (25,001 to 35,000),
    // mission 20 current, 372 owned, next chest tier 17, "Rare, 4 stars" with 17 toward the next.
    const day8 = {
      ...base,
      points: 15_657,
      rank: 26_602,
      nowMs: start + 7 * DAY_MS,
      startRarity: "Rare",
      mission: 20,
      owned: {
        currency: 372,
        nextTier: 17,
        step: "rare-4",
        toNext: 17,
      } as const,
    }

    it("projects day 8 from the shards held and the income still to come", () => {
      const pace = projectHrePace(hreRules.rewards, day8)
      expect(pace.projectedPoints).toBe(31_314)
      expect(pace.bracket.daily).toBe(44)
      expect(pace.currency).toEqual({
        owned: 372,
        milestones: 1540,
        missions: 100,
        daily: 308,
        crates: 340,
        total: 2660,
      })
      expect(pace.currency.total - 372).toBe(2288)
      expect(pace.chest).toEqual({ from: 17, tier: 20, spent: 2100, left: 560 })
      expect(pace.shards).toEqual({
        held: 297,
        chests: 123,
        crates: 18,
        total: 438,
      })
      expect(pace.reached?.id).toBe("rare-red-1")
      expect(pace.next?.id).toBe("epic-red-1")
      expect(pace.shortOfNext).toBe(22)
      expect(pace.ohSoClose).toBe(true)
      expect(pace.owned).toMatchObject({
        step: { id: "rare-4" },
        toNext: 17,
        next: { id: "rare-5" },
        gap: 50,
      })
      // The points-only chain for the same points.
      expect(
        projectHrePace(hreRules.rewards, { ...day8, owned: null }).shards.total
      ).toBe(431)
    })

    it("names the next milestone and the next chest", () => {
      const pace = projectHrePace(hreRules.rewards, day8)
      expect(pace.nextMilestone).toEqual({ points: 16_000, reward: 175 })
      expect(pace.nextChest).toEqual({ tier: 17, cost: 450, missing: 78 })
      const day4 = projectHrePace(hreRules.rewards, {
        ...day8,
        points: 7464,
        nowMs: start + 3.5 * DAY_MS,
        owned: { ...day8.owned, currency: 26, nextTier: 14 },
      })
      expect(day4.nextMilestone).toEqual({ points: 8000, reward: 140 })
      expect(day4.nextChest).toEqual({ tier: 14, cost: 360, missing: 334 })
      expect(
        projectHrePace(hreRules.rewards, { ...day8, points: 1_000_000 })
          .nextMilestone
      ).toBeNull()
    })

    it("measures the Epic 1 red star target from what the player holds", () => {
      const pace = projectHrePace(hreRules.rewards, {
        ...day8,
        target: "epic-red-1",
      })
      expect(pace.target).toMatchObject({
        chestShards: 145,
        chestTier: 21,
        currency: 2750,
        milestoneCurrency: 1630,
        points: 33_000,
        pointsPerDay: 2478,
        covered: false,
        timeUp: false,
      })
    })

    it("reads the target as reached once no chest shards are needed", () => {
      const pace = projectHrePace(hreRules.rewards, {
        ...day8,
        owned: { ...day8.owned, step: "rare-red-1", toNext: 60 },
        target: "epic-red-1",
      })
      expect(pace.shards.held).toBe(450)
      expect(pace.target).toMatchObject({
        chestShards: 0,
        covered: true,
        milestoneCurrency: 0,
      })
    })

    it("reads the target as out of reach with no days left", () => {
      const pace = projectHrePace(hreRules.rewards, {
        ...day8,
        nowMs: end,
        target: "epic-red-1",
      })
      expect(pace.target).toMatchObject({
        covered: false,
        timeUp: true,
        points: null,
        pointsPerDay: null,
      })
    })

    it("counts the shards toward the unlock from 0", () => {
      expect(
        ownedFrom(
          hreRules.rewards,
          { currency: 0, nextTier: 1, step: "none", toNext: 214 },
          "Rare"
        )
      ).toEqual({ currency: 0, nextTier: 1, step: "none", toNext: 214 })
      const pace = projectHrePace(hreRules.rewards, {
        ...day8,
        owned: { currency: 0, nextTier: 1, step: "none", toNext: 214 },
      })
      expect(pace.shards.held).toBe(214)
      expect(pace.owned).toMatchObject({ step: null, gap: 280 })
    })

    it("keeps the points-only chain until every owned input is set", () => {
      expect(
        ownedFrom(
          hreRules.rewards,
          { currency: 372, nextTier: null, step: "rare-4", toNext: 17 },
          "Rare"
        )
      ).toBeNull()
      expect(
        ownedFrom(
          hreRules.rewards,
          { currency: 372, nextTier: 17, step: "rare-4", toNext: null },
          "Rare"
        )
      ).toBeNull()
      // No next step at Legendary blue star: the shards toward it count as 0.
      expect(
        ownedFrom(
          hreRules.rewards,
          {
            currency: 372,
            nextTier: 17,
            step: "legendary-blue-1",
            toNext: null,
          },
          "Rare"
        )
      ).toMatchObject({ toNext: 0 })
    })
  })

  it("dates the rank by local calendar day", () => {
    const pace = projectHrePace(hreRules.rewards, {
      ...base,
      rank: 30_668,
      rankAt: end - 2 * DAY_MS,
    })
    expect(pace.rankAgeDays).toBe(2)
    expect(projectHrePace(hreRules.rewards, base).rankAgeDays).toBeNull()
    expect(calendarDaysBetween(end, end)).toBe(0)
  })

  it("starts the steps at the hero's unlock rarity", () => {
    const pace = projectHrePace(hreRules.rewards, {
      ...base,
      points: 0,
      rank: null,
      startRarity: "Rare",
    })
    expect(pace.next?.id).toBe("rare-4")
  })
})

describe("selectTeamPlans", () => {
  const modes = (state: HreProgress, spare: HreSpareTokens = {}) =>
    selectTeamPlans(state, hreMissions, spare).map(
      (plan) => `${plan.mode}:${plan.rule}`
    )
  const all = {
    arena: { held: 15, need: 12 },
    onslaught: { held: 3, need: 1 },
    salvageRun: { held: 3, need: 2 },
  }

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
      selectTeamPlans(progress({ mission: 12 }), hreMissions).every(
        (plan) => plan.support
      )
    ).toBe(true)
    expect(modes(progress({ mission: 8, progress: [0, 20_000] }))).toEqual([
      "guildRaid:strongest",
    ])
  })

  it("plays the manual objectives in the spare-token modes, Arena first, Onslaught first for abilities", () => {
    // Mission 6: healing and summon-free wins, Arena, Salvage Run, then Onslaught.
    expect(modes(progress({ mission: 6 }), all)).toEqual([
      "battle:summonFree",
      "arena:summonFree",
      "salvageRun:summonFree",
      "onslaught:summonFree",
    ])
    // Mission 3: ability uses, Onslaught first.
    expect(modes(progress({ mission: 3, progress: [20, 0] }), all)).toEqual([
      "battle:abilities",
      "onslaught:abilities",
      "arena:abilities",
      "salvageRun:abilities",
    ])
    // Mission 5: ability damage, Guild Raid first, then Onslaught.
    const withGuildRaid = { ...all, guildRaid: { held: 3, need: 2 } }
    expect(modes(progress({ mission: 5 }), withGuildRaid)).toEqual([
      "battle:strongest",
      "guildRaid:strongest",
      "onslaught:strongest",
      "arena:strongest",
      "salvageRun:strongest",
    ])
    // Guild Raid serves only ability damage.
    expect(
      modes(progress({ mission: 3, progress: [20, 0] }), withGuildRaid)
    ).not.toContain("guildRaid:abilities")
    expect(modes(progress({ mission: 6 }), withGuildRaid)).not.toContain(
      "guildRaid:summonFree"
    )
    // No spare tokens, no spare teams.
    expect(modes(progress({ mission: 3 }))).toEqual(["battle:abilities"])
  })

  it("leaves out the overkill modes for kills and stops once the kills are covered", () => {
    // Mission 1: 5 melee kills. Arena's 3 spare battles cover them; Onslaught is overkill.
    expect(modes(progress({ mission: 1, progress: [2, 0] }), all)).toEqual([
      "battle:melee",
      "arena:melee",
    ])
    // Without spare Arena tokens, Salvage Run and Onslaught are still overkill for 5 kills.
    expect(
      modes(progress({ mission: 1, progress: [2, 0] }), {
        onslaught: all.onslaught,
        salvageRun: all.salvageRun,
      })
    ).toEqual(["battle:melee"])
    // Mission 2: 10 alliance kills, covered by 3 Arena battles.
    expect(modes(progress({ mission: 2, progress: [5, 0] }), all)).toEqual([
      "battle:alliance",
      "arena:alliance",
    ])
    // Mission 4 already plays Arena for its token objective; 50 ranged kills take both others.
    expect(modes(progress({ mission: 4 }), all)).toEqual([
      "battle:ranged",
      "arena:ranged",
      "salvageRun:ranged",
      "onslaught:ranged",
    ])
    // 45 of 50 done: 5 left, so neither Salvage Run nor Onslaught.
    expect(modes(progress({ mission: 4, progress: [0, 45] }), all)).toEqual([
      "battle:ranged",
      "arena:ranged",
    ])
  })

  it("names the spare and fields the whole alliance for Onslaught ability uses", () => {
    const plans = selectTeamPlans(progress({ mission: 3 }), hreMissions, {
      onslaught: { held: 3, need: 1 },
    })
    expect(plans[1]).toMatchObject({
      mode: "onslaught",
      rule: "abilities",
      spare: { held: 3, need: 1 },
      reserve: null,
      wholeTrack: true,
    })
    expect(plans[0]).toMatchObject({ spare: null, wholeTrack: false })
    expect(
      selectTeamPlans(progress({ mission: 9 }), hreMissions, {
        onslaught: { held: 3, need: 1 },
      })[1]
    ).toMatchObject({
      mode: "onslaught",
      size: 8,
      preferPsychic: true,
      wholeTrack: false,
    })
  })
})

describe("spareTokens", () => {
  it("keeps the modes with tokens above the remaining missions' need", () => {
    const state = progress({ mission: 6 })
    expect(
      spareTokens(state, hreMissions, {
        arena: 20,
        onslaught: 0,
        salvageRun: null,
        guildRaid: 9,
      })
    ).toEqual({
      arena: { held: 20, need: tokenNeeds(state, hreMissions).arena },
      guildRaid: { held: 9, need: tokenNeeds(state, hreMissions).guildRaid },
    })
    expect(
      spareTokens(state, hreMissions, {
        arena: null,
        onslaught: null,
        salvageRun: null,
        guildRaid: null,
      })
    ).toEqual({})
  })
})

describe("tips", () => {
  it("names the next token mission's reserve, never the current one's", () => {
    expect(nextTokenReserve(1, hreMissions)).toEqual({
      mode: "arena",
      tokens: 4,
      missionNumber: 4,
    })
    expect(nextTokenReserve(7, hreMissions)).toEqual({
      mode: "guildRaid",
      tokens: 2,
      missionNumber: 8,
    })
    expect(nextTokenReserve(15, hreMissions)).toBeNull()
  })
})

describe("brackets", () => {
  it("resolves rank 3,200 to the 2,501 to 5,000 bracket and no rank to the last", () => {
    expect(
      bracketRange(hreRules.rewards, bracketForRank(hreRules.rewards, 3200))
    ).toEqual({ from: 2501, to: 5000 })
    expect(
      bracketRange(hreRules.rewards, bracketForRank(hreRules.rewards, null))
    ).toEqual({
      from: 200_001,
      to: null,
    })
    expect(
      bracketRange(hreRules.rewards, bracketForRank(hreRules.rewards, 1))
    ).toEqual({ from: 1, to: 1 })
  })
})
