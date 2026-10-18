import { describe, expect, it } from "vitest"

import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"

import { teamEffectivePower } from "./clear-estimate"
import {
  UTHAR_ALPHA_MODEL,
  UTHAR_ALPHA_POWERS,
  UTHAR_ALPHA_PROGRESS,
  WORKED_CONFIG,
  rosterUnit,
  workedInitialRarity,
} from "./clear-estimate.fixtures"
import {
  laneUpgradeImpact,
  type ImpactTeam,
  type UpgradeImpactInput,
} from "./upgrade-impact"

const ULTRAMARINES = 0
const MELEE = 3
const FOUR_MEMBERS = [
  "ultraCalgar",
  "ultraTigurius",
  "ultraTitus",
  "ultraApothecary",
]
const four: ImpactTeam = {
  id: "four",
  memberUnitIds: FOUR_MEMBERS,
  coveredObjectiveIndexes: [ULTRAMARINES],
  manualDepth: null,
}
const melee: ImpactTeam = {
  id: "melee",
  memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
  coveredObjectiveIndexes: [ULTRAMARINES, MELEE],
  manualDepth: 6,
}

const workedRoster = new Map([
  ["ultraCalgar", rosterUnit("ultraCalgar")],
  ["ultraTigurius", rosterUnit("ultraTigurius", "Epic:RedTwoStars")],
  ["ultraTitus", rosterUnit("ultraTitus")],
  ["ultraApothecary", rosterUnit("ultraApothecary")],
])

const impact = (overrides: Partial<UpgradeImpactInput> = {}) =>
  laneUpgradeImpact({
    model: UTHAR_ALPHA_MODEL,
    progress: UTHAR_ALPHA_PROGRESS,
    teams: [four],
    battlePowers: UTHAR_ALPHA_POWERS,
    roster: workedRoster,
    config: WORKED_CONFIG,
    initialRarityOf: workedInitialRarity,
    nameOf: (unitId) => fixtureCharacter(unitId).name,
    ...overrides,
  })

describe("laneUpgradeImpact (spec worked examples)", () => {
  it("lists four +191 rows, Four battle 5 → 6, ordered by name", () => {
    expect(
      teamEffectivePower(FOUR_MEMBERS, workedRoster, WORKED_CONFIG)
    ).toBeCloseTo(90579.4, 6)
    const steppedTigurius = new Map(workedRoster).set(
      "ultraTigurius",
      rosterUnit("ultraTigurius", "Epic:RedThreeStars")
    )
    expect(
      teamEffectivePower(FOUR_MEMBERS, steppedTigurius, WORKED_CONFIG)
    ).toBeCloseTo(92993.8, 6)
    const steppedCalgar = new Map(workedRoster).set(
      "ultraCalgar",
      rosterUnit("ultraCalgar", "Epic:RedTwoStars")
    )
    expect(
      teamEffectivePower(FOUR_MEMBERS, steppedCalgar, WORKED_CONFIG)
    ).toBeCloseTo(93059.4, 6)

    const result = impact()
    expect(result.baselinePoints).toBe(620)
    expect(result.rows.map((row) => row.unitId)).toEqual([
      "ultraCalgar",
      "ultraApothecary",
      "ultraTigurius",
      "ultraTitus",
    ])
    for (const row of result.rows) {
      expect(row.step.kind).toBe("ascension")
      expect(row.gainPoints).toBe(191)
      expect(row.teams).toEqual([
        { teamId: "four", depthBefore: 5, depthAfter: 6 },
      ])
    }
    expect(result.rows[2]?.step).toMatchObject({
      kind: "ascension",
      progression: "Epic:RedThreeStars",
    })
  })

  it("moves a stored depth by the estimate delta: 4 → 5, +187", () => {
    const result = impact({ teams: [{ ...four, manualDepth: 4 }] })
    expect(result.baselinePoints).toBe(433)
    const tigurius = result.rows.find((row) => row.unitId === "ultraTigurius")
    expect(tigurius?.gainPoints).toBe(187)
    expect(tigurius?.teams).toEqual([
      { teamId: "four", depthBefore: 4, depthAfter: 5 },
    ])
  })

  it("lists nothing when another team already reaches the battle", () => {
    // Calgar's step lifts Melee to 70,791, still below battle 6's 90,944.4.
    const result = impact({ teams: [four, melee] })
    expect(result.rows).toEqual([])
  })

  it("does not list an unlock that reaches no new battle (88,317.4 → 88,362.4)", () => {
    const roster = new Map(workedRoster).set(
      "ultraTigurius",
      rosterUnit("ultraTigurius")
    )
    const five: ImpactTeam = {
      ...four,
      id: "five",
      memberUnitIds: [...FOUR_MEMBERS, "ultraEliminatorSgt"],
    }
    const unlocked = new Map(roster).set("ultraEliminatorSgt", {
      unitId: "ultraEliminatorSgt" as never,
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
    })
    expect(
      teamEffectivePower(five.memberUnitIds, roster, WORKED_CONFIG)
    ).toBeCloseTo(88317.4, 6)
    // Certus's base power 45 adds too little for battle 6's 90,944.4.
    expect(
      teamEffectivePower(five.memberUnitIds, unlocked, WORKED_CONFIG)
    ).toBeCloseTo(88362.4, 6)
    const result = impact({ teams: [five], roster })
    expect(result.rows.some((row) => row.step.kind === "unlock")).toBe(false)
  })

  it("reports every team of the lane holding a unit", () => {
    const result = impact({
      teams: [four, { ...four, id: "copy", manualDepth: 4 }],
    })
    const tigurius = result.rows.find((row) => row.unitId === "ultraTigurius")
    // Copy's 4 → 5 adds nothing Four does not already reach; Four's 5 → 6 adds 43 + 43 + 30 + 75 = 191.
    expect(tigurius?.gainPoints).toBe(191)
    expect(tigurius?.teams).toEqual([
      { teamId: "four", depthBefore: 5, depthAfter: 6 },
      { teamId: "copy", depthBefore: 4, depthAfter: 5 },
    ])
  })

  it("lists rank steps: four Legendary:RedFiveStars Silver3 members, Silver3 → Gold1, 5 → 6", () => {
    const roster = new Map(
      FOUR_MEMBERS.map((unitId) => [
        unitId,
        { ...rosterUnit(unitId, "Legendary:RedFiveStars"), rank: "Silver3" },
      ])
    )
    const result = impact({ roster: roster as UpgradeImpactInput["roster"] })
    expect(result.rows).toHaveLength(4)
    for (const row of result.rows) {
      expect(row.step).toMatchObject({ kind: "rank", rank: "Gold1" })
      expect(row.gainPoints).toBe(191)
      expect(row.teams).toEqual([
        { teamId: "four", depthBefore: 5, depthAfter: 6 },
      ])
    }
  })

  it("caps the moved depth at the lane's battle count", () => {
    // Legendary:RedThreeStars, Tigurius at Gold1 and the others at Gold2: 157,507.8 is estimated
    // 6, and Tigurius's rank step (170,886.6) reaches battle 7, the lane's last.
    const roster = new Map(
      FOUR_MEMBERS.map((unitId) => [
        unitId,
        {
          ...rosterUnit(unitId, "Legendary:RedThreeStars"),
          rank: unitId === "ultraTigurius" ? "Gold1" : "Gold2",
        },
      ])
    ) as UpgradeImpactInput["roster"]
    expect(teamEffectivePower(FOUR_MEMBERS, roster, WORKED_CONFIG)).toBeCloseTo(
      157507.8,
      6
    )
    const tigurius = impact({ roster }).rows.find(
      (row) => row.unitId === "ultraTigurius" && row.step.kind === "rank"
    )
    expect(tigurius?.teams).toEqual([
      { teamId: "four", depthBefore: 6, depthAfter: 7 },
    ])
    const atLastBattle = impact({
      roster,
      teams: [{ ...four, manualDepth: UTHAR_ALPHA_POWERS.length }],
    })
    expect(atLastBattle.rows).toEqual([])
  })

  it("moves a stored depth from a null estimate when an unlock makes the team estimable", () => {
    // Every member locked: no estimate; the stored depth 2 moves by the unlocked estimate. With
    // battle 1 at 100 (threshold 120), Calgar's base power 162 reaches it and not battle 2.
    const result = impact({
      roster: new Map(),
      battlePowers: [100, ...UTHAR_ALPHA_POWERS.slice(1)],
      teams: [{ ...four, manualDepth: 2 }],
    })
    const calgar = result.rows.find((row) => row.unitId === "ultraCalgar")
    expect(calgar?.step.kind).toBe("unlock")
    // Battle 3: 35 + 35 + 30 + 75.
    expect(calgar?.gainPoints).toBe(175)
    expect(calgar?.teams).toEqual([
      { teamId: "four", depthBefore: 2, depthAfter: 3 },
    ])
  })

  it("lists nothing when power data is unavailable", () => {
    const result = impact({ config: { ...WORKED_CONFIG, unitPower: null } })
    // No estimate: every team reads depth 0.
    expect(result.baselinePoints).toBe(0)
    expect(result.rows).toEqual([])
  })

  it("reads a missing estimate as depth 0", () => {
    const result = impact({ battlePowers: [] })
    expect(result.baselinePoints).toBe(0)
    expect(result.rows).toEqual([])
  })
})
