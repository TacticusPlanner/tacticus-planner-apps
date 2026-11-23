import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"

import type { Battle } from "@/shared/lib"
import { buildMissionGoalNodes, planMissionRaids } from "./mission-raids"
import type {
  MissionGoalNode,
  MissionRaidBattle,
  PlanMissionRaidsInput,
} from "./mission-raids"

const id = (value: string) => value as BattleId

const node = (
  battleId: string,
  energyCost: number,
  dailyAttempts: number,
  options: {
    isEvent?: boolean
    expectedGold?: number
    drops?: [string, number][]
  } = {}
): MissionRaidBattle => ({
  id: id(battleId),
  energyCost,
  dailyAttempts,
  isEvent: options.isEvent ?? false,
  expectedGold: options.expectedGold ?? 12.5,
  dropRates: new Map(options.drops ?? [[`drop${battleId}`, 0.2]]),
})

const goal = (resourceId: string, priority = 1): MissionGoalNode => ({
  priority,
  goalIds: [`g${priority}`],
  resourceId: resourceId as never,
})

// Indomitus I06-I14 cost 3 with a cap of 3 and drop nothing; I15-I29 cost 5 with a cap of 10.
const noDrop = Array.from({ length: 9 }, (_, index) =>
  node(`I${String(index + 6).padStart(2, "0")}`, 3, 3, {
    expectedGold: 7.5,
    drops: [],
  })
)
const fives = Array.from({ length: 15 }, (_, index) =>
  node(`I${index + 15}`, 5, 10)
)
const indomitus = [...noDrop, ...fives]

const base = (
  overrides: Partial<PlanMissionRaidsInput> = {}
): PlanMissionRaidsInput => ({
  battlesToGo: 63,
  eventOnly: false,
  battles: indomitus,
  attemptsLeftByBattle: new Map(),
  dailyEnergy: 538,
  realEnergyUsedToday: 0,
  goalNodesByBattle: new Map(),
  passesFilter: () => true,
  ...overrides,
})

// 38 battles to go with 350 of 538 energy spent: a budget of 188.
const mission5 = (overrides: Partial<PlanMissionRaidsInput> = {}) =>
  base({ battlesToGo: 38, realEnergyUsedToday: 350, ...overrides })

const raidsOf = (rows: readonly { battleId: string; raids: number }[]) =>
  Object.fromEntries(rows.map((row) => [row.battleId, row.raids]))

describe("planMissionRaids", () => {
  it("fills the nodes that drop something, cheapest first", () => {
    const plan = planMissionRaids(mission5())
    expect(plan.battlesLeft).toBe(38)
    expect(plan.energyBudget).toBe(188)
    expect(raidsOf(plan.rows)).toEqual({ I15: 10, I16: 10, I17: 10, I18: 7 })
    expect(plan.totalRaids).toBe(37)
    expect(plan.totalEnergy).toBe(185)
    expect(plan.remainingAfter).toBe(1)
  })

  it("fills the no-drop Indomitus nodes on their own, as an alternative", () => {
    const plan = planMissionRaids(mission5())
    expect(plan.noDropRows.map((row) => row.battleId)).toEqual(
      noDrop.map((battle) => battle.id)
    )
    expect(plan.noDropRows.every((row) => row.raids === 3)).toBe(true)
  })

  it("suggests nothing once today's energy is spent", () => {
    const plan = planMissionRaids(base({ realEnergyUsedToday: 538 }))
    expect(plan.energyBudget).toBe(0)
    expect(plan.rows).toEqual([])
    expect(plan.empty).toBe("no-energy")
  })

  it("says attempts ran out when energy is still left", () => {
    const plan = planMissionRaids(
      base({
        attemptsLeftByBattle: new Map(
          indomitus.map((battle) => [battle.id, 0])
        ),
      })
    )
    expect(plan.energyBudget).toBe(538)
    expect(plan.rows).toEqual([])
    expect(plan.empty).toBe("no-attempts")
  })

  it("uses the synced attempts left on a node", () => {
    const plan = planMissionRaids(
      base({
        battles: [node("I30", 6, 10)],
        battlesToGo: 50,
        attemptsLeftByBattle: new Map([[id("I30"), 6]]),
      })
    )
    expect(plan.rows[0]?.raids).toBe(6)
  })

  it("puts goal drops first, by drop rate, then by gold", () => {
    const plan = planMissionRaids(
      base({
        battles: [
          node("FoCM04", 6, 10, {
            expectedGold: 53,
            drops: [["upgDmgU019", 0.15]],
          }),
          node("IM37", 6, 10, {
            expectedGold: 65,
            drops: [["upgDmgU019", 0.15]],
          }),
          node("FoCM71", 6, 10, {
            expectedGold: 77,
            drops: [["upgHpL103", 0.01]],
          }),
          node("FoCM09", 6, 10, {
            expectedGold: 53,
            drops: [["upgArmC003", 0.2]],
          }),
          node("SH50", 6, 10, { expectedGold: 90 }),
        ],
        battlesToGo: 50,
        goalNodesByBattle: new Map([
          [id("FoCM04"), goal("upgDmgU019", 2)],
          [id("IM37"), goal("upgDmgU019", 2)],
          [id("FoCM71"), goal("upgHpL103", 1)],
          [id("FoCM09"), goal("upgArmC003", 3)],
        ]),
      })
    )
    expect(plan.rows.map((row) => row.battleId)).toEqual([
      "FoCM09",
      "IM37",
      "FoCM04",
      "FoCM71",
      "SH50",
    ])
    expect(plan.rows[0]?.goal?.resourceId).toBe("upgArmC003")
  })

  it("puts a goal node first, even over a cheaper node", () => {
    const plan = planMissionRaids(
      base({
        battles: [
          node("FoCM09", 6, 10, { drops: [["upgArmC003", 0.2]] }),
          node("I28", 5, 10, { drops: [["upgArmC003", 0.2]] }),
        ],
        battlesToGo: 5,
        goalNodesByBattle: new Map([[id("FoCM09"), goal("upgArmC003")]]),
      })
    )
    expect(plan.rows.map((row) => row.battleId)).toEqual(["FoCM09"])
  })

  it("skips a node that no longer fits the budget", () => {
    const plan = planMissionRaids(base({ battlesToGo: 38, dailyEnergy: 30 }))
    expect(plan.totalRaids).toBe(6)
    expect(plan.totalEnergy).toBe(30)
    expect(plan.remainingAfter).toBe(32)
  })

  it("tells filtered-out candidates apart from none", () => {
    expect(planMissionRaids(base({ passesFilter: () => false })).empty).toBe(
      "filtered"
    )
    expect(planMissionRaids(base({ battles: [] })).empty).toBe("no-candidates")
  })

  it("keeps the empty reason to the nodes that drop something", () => {
    const onlyNoDrop = planMissionRaids(base({ battles: noDrop }))
    expect(onlyNoDrop.empty).toBe("no-candidates")
    expect(onlyNoDrop.noDropRows).toHaveLength(9)
    const dropsFiltered = planMissionRaids(
      base({ passesFilter: (battleId) => battleId < "I15" })
    )
    expect(dropsFiltered.empty).toBe("filtered")
    expect(dropsFiltered.noDropRows).toHaveLength(9)
  })

  it("hands the outlook every raidable node", () => {
    const plan = planMissionRaids(base())
    expect(plan.outlookNodes).toHaveLength(24)
    expect(plan.outlookNodes[0]).toEqual({ energyCost: 3, dailyAttempts: 3 })
    expect(plan.dailyEnergy).toBe(538)
  })

  describe("lightning victories", () => {
    const event = [
      node("AMS1", 6, 10, { isEvent: true }),
      node("AMS2", 6, 10, { isEvent: true }),
    ]

    it("suggests event-campaign nodes only", () => {
      const plan = planMissionRaids(
        base({
          battles: [...indomitus, ...event],
          eventOnly: true,
          battlesToGo: 15,
        })
      )
      expect(plan.rows.map((row) => row.battleId)).toEqual(["AMS1", "AMS2"])
      expect(plan.totalRaids).toBe(15)
      expect(plan.noDropRows).toEqual([])
    })

    it("says no campaign event is running", () => {
      const plan = planMissionRaids(base({ eventOnly: true, battlesToGo: 2 }))
      expect(plan.empty).toBe("no-event")
    })
  })
})

describe("planMissionRaids quick filters and energy", () => {
  const pair = (overrides: Partial<PlanMissionRaidsInput> = {}) =>
    base({
      battlesToGo: 10,
      battles: [
        node("A", 5, 10, { drops: [["dA", 0.2]] }),
        node("B", 5, 10, { drops: [["dB", 0.2]] }),
      ],
      goalNodesByBattle: new Map([
        [id("A"), goal("dA", 2)],
        [id("B"), goal("dB", 1)],
      ]),
      ...overrides,
    })

  it("breaks ties by goal priority, and by battle id with Combine goals", () => {
    expect(raidsOf(planMissionRaids(pair()).rows)).toEqual({ B: 10 })
    expect(
      raidsOf(planMissionRaids(pair({ combineGoals: true })).rows)
    ).toEqual({ A: 10 })
  })

  it("is bound only by attempts and the objective with unlimited energy", () => {
    const plan = planMissionRaids(
      mission5({ realEnergyUsedToday: 538, unlimitedEnergy: true })
    )
    expect(plan.energyBudget).toBe(Infinity)
    expect(plan.totalRaids).toBe(38)
    expect(plan.remainingAfter).toBe(0)
  })
})

describe("planMissionRaids with CE nodes first", () => {
  it("ranks the running campaign event's nodes ahead of cheaper ones", () => {
    const event = node("E10", 6, 10, { isEvent: true })
    const plan = planMissionRaids(
      base({
        battlesToGo: 12,
        battles: [...indomitus, event],
        preferredBattleIds: new Set([id("E10")]),
      })
    )
    expect(raidsOf(plan.rows)).toEqual({ E10: 10, I15: 2 })
  })

  it("still puts a node feeding a goal first", () => {
    const event = node("E10", 6, 10, { isEvent: true })
    const plan = planMissionRaids(
      base({
        battlesToGo: 12,
        battles: [...indomitus, event],
        goalNodesByBattle: new Map([[id("I20"), goal("dropI20")]]),
        preferredBattleIds: new Set([id("E10")]),
      })
    )
    expect(plan.rows.map((row) => row.battleId)).toEqual(["I20", "E10"])
  })
})

describe("planMissionRaids stops favouring a covered goal resource", () => {
  it("takes only the raids that cover the need, then fills by energy", () => {
    // 6 stimms needed: the 10-energy Extremis node drops one every raid, two 5-energy nodes too.
    const extremis = node("X14", 10, 5, { drops: [["stimms", 1]] })
    const mirror = node("M56", 8, 10, { drops: [["stimms", 0.5]] })
    const plan = planMissionRaids(
      base({
        battlesToGo: 12,
        battles: [...indomitus, extremis, mirror],
        goalNodesByBattle: new Map([
          [id("X14"), { ...goal("stimms"), need: 6 }],
          [id("M56"), { ...goal("stimms"), need: 6 }],
        ]),
      })
    )
    // X14's 5 raids leave 1 stimm, which M56 covers in 2; the other 5 raids go to the cheapest node.
    expect(raidsOf(plan.rows)).toEqual({ X14: 5, M56: 2, I15: 5 })
  })

  it("keeps favouring the goal's nodes when its need is unknown", () => {
    const extremis = node("X14", 10, 5, { drops: [["stimms", 1]] })
    const mirror = node("M56", 8, 10, { drops: [["stimms", 0.5]] })
    const plan = planMissionRaids(
      base({
        battlesToGo: 12,
        battles: [...indomitus, extremis, mirror],
        goalNodesByBattle: new Map([
          [id("X14"), goal("stimms")],
          [id("M56"), goal("stimms")],
        ]),
      })
    )
    // Least energy per stimm first (10 at X14, 16 at M56), then the goal's other node.
    expect(raidsOf(plan.rows)).toEqual({ X14: 5, M56: 7 })
  })
})

describe("planMissionRaids from Today's raids", () => {
  const entry = (battleId: string, raidsPerformed: number) => ({
    battleId: id(battleId),
    raidsPerformed,
    goalId: "g1",
    resourceId: `drop${battleId}` as never,
  })

  it("starts from Today's raids in Today's order, then tops up the cheapest", () => {
    const plan = planMissionRaids(
      base({
        battlesToGo: 15,
        unlimitedEnergy: true,
        // Today raids I25 for a goal before I20; neither is the cheapest of the 5-energy nodes.
        todayEntries: [entry("I25", 4), entry("I20", 6)],
      })
    )
    expect(plan.rows.map((row) => [row.battleId, row.raids])).toEqual([
      ["I25", 4],
      ["I20", 6],
      ["I15", 5],
    ])
    expect(plan.rows[0]?.goal?.resourceId).toBe("dropI25")
  })

  it("cuts the last of Today's raids to the battles left", () => {
    const plan = planMissionRaids(
      base({
        battlesToGo: 5,
        unlimitedEnergy: true,
        todayEntries: [entry("I25", 4), entry("I20", 6)],
      })
    )
    expect(raidsOf(plan.rows)).toEqual({ I25: 4, I20: 1 })
  })

  it("leaves out Today's raids that don't count, such as standing nodes for lightning victories", () => {
    const event = node("E10", 6, 10, { isEvent: true })
    const plan = planMissionRaids(
      base({
        battlesToGo: 3,
        eventOnly: true,
        unlimitedEnergy: true,
        battles: [...indomitus, event],
        todayEntries: [entry("I25", 4), entry("E10", 2)],
      })
    )
    expect(raidsOf(plan.rows)).toEqual({ E10: 3 })
  })

  it("keeps Today's raids within the node's attempts left", () => {
    const plan = planMissionRaids(
      base({
        battlesToGo: 6,
        unlimitedEnergy: true,
        attemptsLeftByBattle: new Map([[id("I25"), 2]]),
        todayEntries: [entry("I25", 4)],
      })
    )
    expect(raidsOf(plan.rows)).toEqual({ I25: 2, I15: 4 })
  })
})

describe("buildMissionGoalNodes", () => {
  const battle = (campaignGroupId: string, type: string): Battle => ({
    campaignGroupId: campaignGroupId as Battle["campaignGroupId"],
    type,
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost: type === "Elite" || type === "Extremis" ? 10 : 6,
    dailyAttempts: type === "Elite" ? 6 : 10,
  })
  const battlesById = new Map<BattleId, Battle>([
    [id("standard"), battle("campaign2", "Standard")],
    [id("mirror"), battle("mirror2", "Mirror")],
    [id("elite"), battle("elite2", "Elite")],
    [id("eliteMirror"), battle("eliteMirror2", "Elite")],
    [id("eventStandard"), battle("eventCampaign1", "Standard")],
    [id("extremis"), battle("eventCampaign1", "Extremis")],
  ])
  const upgrade = (resourceId: string) => ({
    id: resourceId as never,
    farmLocations: [...battlesById.keys()].map((battleId) => ({
      battleId,
      guaranteed: false,
      effectiveRate: 0.1,
      numerator: null,
      denominator: null,
      isMythic: false,
    })),
  })
  const nodesFor = (
    rarity: "Rare" | "Epic" | "Legendary",
    farmingLocationIds?: string[]
  ) =>
    [
      ...buildMissionGoalNodes(
        [
          {
            goalId: "g1",
            priority: 1,
            needs: [{ id: "U" as never, count: 5 }],
            farmingLocationIds,
          },
        ],
        [],
        new Map([["U" as never, upgrade("U")]]),
        battlesById,
        () => rarity
      ).keys(),
    ].toSorted((a, b) => a.localeCompare(b))

  it("farms a Rare upgrade on any node", () => {
    expect(nodesFor("Rare")).toHaveLength(6)
  })

  it("farms Epic and Legendary upgrades on Elite and Extremis nodes only", () => {
    for (const rarity of ["Epic", "Legendary"] as const) {
      expect(nodesFor(rarity)).toEqual(["elite", "eliteMirror", "extremis"])
    }
  })

  it("keeps a pinned location whatever its tier", () => {
    expect(nodesFor("Legendary", ["mirror"])).toEqual(["mirror"])
  })

  it("carries what every goal still needs of the node's resource", () => {
    const nodes = buildMissionGoalNodes(
      [
        { goalId: "g1", priority: 1, needs: [{ id: "U" as never, count: 5 }] },
        { goalId: "g2", priority: 2, needs: [{ id: "U" as never, count: 3 }] },
      ],
      [],
      new Map([["U" as never, upgrade("U")]]),
      battlesById
    )
    expect(nodes.get(id("elite"))).toEqual(
      expect.objectContaining({ goalIds: ["g1", "g2"], need: 8 })
    )
  })
})
