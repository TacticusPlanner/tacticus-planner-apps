import { describe, expect, it } from "vitest"

import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import {
  lysanderBattleNpcs,
  lysanderBattles,
} from "@/test/fixtures/lysander-battles"

import type { LegendaryEventRunInputs } from "../model/plan.types"
import {
  battleEnemies,
  currentMissions,
  doneMissionCount,
  doneMissionIndexes,
  eventMissions,
  openMissions,
  tokenMissionAmount,
  tokenProgressesMission,
  type LegendaryEventMission,
} from "./missions"

const npcsById = new Map(lysanderBattleNpcs.map((npc) => [npc.id, npc]))
const enemiesOf = (id: string) =>
  battleEnemies(
    lysanderBattles.find((battle) => battle.id === id)!,
    npcsById
  )

const regular = (index: number) =>
  eventMissions(lysanderEvent, "regular").find(
    (mission) => mission.index === index
  )!
const premium = (index: number) =>
  eventMissions(lysanderEvent, "premium").find(
    (mission) => mission.index === index
  )!

const mission = (
  fields: Partial<LegendaryEventMission> & Pick<LegendaryEventMission, "kind">
): LegendaryEventMission => ({
  index: 0,
  count: 1,
  faction: null,
  alliance: null,
  damageType: null,
  trait: null,
  text: "",
  ...fields,
})

const runInputs = (
  run: 1 | 2 | 3,
  fields: Partial<LegendaryEventRunInputs>
): LegendaryEventRunInputs => ({
  run,
  regularMissions: 0,
  premiumMissions: 0,
  bundlePurchased: false,
  closeShards: 0,
  completedRegularMissions: [],
  completedPremiumMissions: [],
  updatedAt: "2026-10-18T00:00:00Z",
  ...fields,
})

describe("eventMissions", () => {
  it("drops missions a catalog cached before typed missions holds as strings", () => {
    const event = {
      regularMissions: ["Defeat 30 Orks", regular(1)],
      premiumMissions: [],
    } as unknown as Parameters<typeof eventMissions>[0]
    expect(eventMissions(event, "regular")).toEqual([regular(1)])
  })
})

describe("done missions", () => {
  const missions = eventMissions(lysanderEvent, "regular")

  it("counts the stored done missions, at most the track's length", () => {
    expect(doneMissionCount(missions, [4, 1, 1])).toBe(2)
    expect(doneMissionCount(missions.slice(0, 2), [0, 1, 2, 3])).toBe(2)
  })

  it("stores the first missions in order as done", () => {
    expect(doneMissionIndexes(missions, 3)).toEqual(
      missions.slice(0, 3).map((mission) => mission.index)
    )
    expect(doneMissionIndexes(missions, -1)).toEqual([])
  })
})

describe("openMissions", () => {
  it("lists the current run's regular missions after the done ones, in order", () => {
    const open = openMissions({
      event: lysanderEvent,
      runs: [
        runInputs(1, { completedRegularMissions: [0, 1, 2] }),
        // Two stored as done: missions finish in order, so missions 1 and 2 are the done ones.
        runInputs(2, { completedRegularMissions: [1, 4] }),
      ],
      currentRun: 2,
      showPaidOptions: false,
    })
    expect(open.map((entry) => entry.mission.index)).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9,
    ])
    expect(open.every((entry) => entry.track === "regular")).toBe(true)
    expect(currentMissions(open).map((entry) => entry.mission.index)).toEqual([
      2,
    ])
  })

  it("adds premium missions only with paid options on and the premium track planned", () => {
    const runs = [
      runInputs(1, { premiumMissions: 3, completedPremiumMissions: [0] }),
    ]
    const premiumOpen = (showPaidOptions: boolean, stored = runs) =>
      openMissions({
        event: lysanderEvent,
        runs: stored,
        currentRun: 1,
        showPaidOptions,
      }).filter((entry) => entry.track === "premium")
    expect(premiumOpen(false)).toEqual([])
    expect(premiumOpen(true, [runInputs(1, {})])).toEqual([])
    expect(premiumOpen(true).map((entry) => entry.mission.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ])
  })

  it("has none without a current run", () => {
    expect(
      openMissions({
        event: lysanderEvent,
        runs: [],
        currentRun: null,
        showPaidOptions: true,
      })
    ).toEqual([])
  })
})

describe("tokenProgressesMission", () => {
  const imperial = [
    fixtureCharacter("astarCyrus"),
    fixtureCharacter("astarEradicator"),
    fixtureCharacter("admecManipulus"),
  ]

  it("matches a faction mission from the battle's wave enemies", () => {
    const orks = regular(1)
    expect(
      tokenProgressesMission(orks, imperial, enemiesOf("astarLysander-alpha-4"))
    ).toBe(true)
    expect(
      tokenProgressesMission(orks, imperial, enemiesOf("astarLysander-beta-4"))
    ).toBe(false)
    expect(tokenProgressesMission(orks, imperial, undefined)).toBe(false)
  })

  it("matches a trait-named enemy mission through enemy traits", () => {
    const daemons = mission({ kind: "defeatFaction", trait: "Daemon" })
    const withDaemon = {
      factions: new Set<string>(),
      traits: new Set(["Daemon"]),
    }
    const without = { factions: new Set(["Daemon"]), traits: new Set<string>() }
    expect(tokenProgressesMission(daemons, imperial, withDaemon)).toBe(true)
    expect(tokenProgressesMission(daemons, imperial, without)).toBe(false)
  })

  it("needs a member of the alliance", () => {
    expect(tokenProgressesMission(regular(6), imperial, undefined)).toBe(true)
    expect(tokenProgressesMission(premium(1), imperial, undefined)).toBe(false)
  })

  it("needs a member dealing the damage type, after damage-profile exclusions", () => {
    const champion = [fixtureCharacter("votanChampion")]
    expect(
      tokenProgressesMission(
        mission({ kind: "damageType", damageType: "Physical" }),
        champion,
        undefined
      )
    ).toBe(true)
    expect(
      tokenProgressesMission(
        mission({ kind: "defeatWithDamageType", damageType: "DirectDamage" }),
        champion,
        undefined
      )
    ).toBe(false)
  })

  it("wins without a trait only when no member has it", () => {
    const noFlying = premium(4)
    expect(tokenProgressesMission(noFlying, imperial, undefined)).toBe(false)
    expect(
      tokenProgressesMission(noFlying, imperial.slice(0, 2), undefined)
    ).toBe(true)
  })

  it("cannot tell summoners apart, so a summon-free mission always progresses", () => {
    expect(tokenProgressesMission(premium(0), imperial, undefined)).toBe(true)
  })

  it("always progresses an any-battle mission and never an unknown kind", () => {
    expect(tokenProgressesMission(regular(0), [], undefined)).toBe(true)
    expect(
      tokenProgressesMission(
        mission({ kind: "somethingNew" }),
        imperial,
        undefined
      )
    ).toBe(false)
  })
})

describe("battleEnemies", () => {
  it("counts each served entry as many enemies as its count", () => {
    const npcs = new Map([
      ["pinkHorror", { factionId: "Tzeentch", traits: ["Daemon"] }],
      ["bloodletter", { factionId: "Khorne", traits: ["Daemon"] }],
    ])
    const wave = (horrors: number, letters: number) => ({
      round: 1,
      power: 100,
      enemies: [
        { id: "pinkHorror", ladderIndex: 1, count: horrors },
        { id: "bloodletter", ladderIndex: 1, count: letters },
      ],
    })
    const battle = battleEnemies(
      {
        waves: [wave(4, 3), wave(3, 2), wave(2, 3), wave(2, 2)],
      } as Parameters<typeof battleEnemies>[0],
      npcs
    )
    expect(battle.counts).toEqual({
      waves: 4,
      enemies: 21,
      byFaction: new Map([
        ["Tzeentch", 11],
        ["Khorne", 10],
      ]),
      byTrait: new Map([["Daemon", 21]]),
    })
  })
})

describe("tokenMissionAmount", () => {
  const imperial = [
    fixtureCharacter("astarCyrus"),
    fixtureCharacter("astarEradicator"),
  ]

  it("counts a faction mission's enemies across the battle's waves", () => {
    const battle = enemiesOf("astarLysander-alpha-4")
    const orks = battle.counts!.byFaction.get("Orks") ?? 0
    expect(orks).toBeGreaterThan(0)
    expect(tokenMissionAmount(regular(1), imperial, battle)).toEqual({
      amount: orks,
      estimate: false,
    })
    expect(
      tokenMissionAmount(
        regular(1),
        imperial,
        enemiesOf("astarLysander-beta-4")
      )
    ).toEqual({ amount: 0, estimate: false })
  })

  it("estimates alliance kills as every enemy of the battle", () => {
    const battle = enemiesOf("astarLysander-alpha-4")
    const withAlliance = (alliance: string) =>
      mission({ kind: "defeatWithAlliance", alliance, count: 75 })
    expect(
      tokenMissionAmount(withAlliance("Imperial"), imperial, battle)
    ).toEqual({ amount: battle.counts!.enemies, estimate: true })
    expect(tokenMissionAmount(withAlliance("Chaos"), imperial, battle)).toEqual(
      { amount: 0, estimate: true }
    )
  })

  it("counts one win without a trait, and leaves untracked kinds out", () => {
    expect(tokenMissionAmount(premium(4), imperial, undefined)).toEqual({
      amount: 1,
      estimate: false,
    })
    expect(tokenMissionAmount(regular(0), imperial, undefined)).toBeNull()
    expect(tokenMissionAmount(premium(0), imperial, undefined)).toBeNull()
  })
})
