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
  it("lists four +148 rows, Four battle 5 → 6, ordered by name", () => {
    expect(
      teamEffectivePower(FOUR_MEMBERS, workedRoster, WORKED_CONFIG)
    ).toBeCloseTo(37534.8, 6)
    const steppedTigurius = new Map(workedRoster).set(
      "ultraTigurius",
      rosterUnit("ultraTigurius", "Epic:RedThreeStars")
    )
    expect(
      teamEffectivePower(FOUR_MEMBERS, steppedTigurius, WORKED_CONFIG)
    ).toBeCloseTo(38143.2, 6)
    const steppedCalgar = new Map(workedRoster).set(
      "ultraCalgar",
      rosterUnit("ultraCalgar", "Epic:RedTwoStars")
    )
    expect(
      teamEffectivePower(FOUR_MEMBERS, steppedCalgar, WORKED_CONFIG)
    ).toBeCloseTo(38041.8, 6)

    const result = impact()
    expect(result.baselinePoints).toBe(505)
    expect(result.rows.map((row) => row.unitId)).toEqual([
      "ultraCalgar",
      "ultraApothecary",
      "ultraTigurius",
      "ultraTitus",
    ])
    for (const row of result.rows) {
      expect(row.step.kind).toBe("ascension")
      expect(row.gainPoints).toBe(148)
      expect(row.teams).toEqual([
        { teamId: "four", depthBefore: 5, depthAfter: 6 },
      ])
    }
    expect(result.rows[2]?.step).toMatchObject({
      kind: "ascension",
      progression: "Epic:RedThreeStars",
    })
  })

  it("moves a stored depth by the estimate delta: 4 → 5, +146", () => {
    const result = impact({ teams: [{ ...four, manualDepth: 4 }] })
    expect(result.baselinePoints).toBe(359)
    const tigurius = result.rows.find((row) => row.unitId === "ultraTigurius")
    expect(tigurius?.gainPoints).toBe(146)
    expect(tigurius?.teams).toEqual([
      { teamId: "four", depthBefore: 4, depthAfter: 5 },
    ])
  })

  it("lists nothing when another team already reaches the battle", () => {
    // Calgar's step lifts Melee to 26,883, still below battle 6's 37,893.5.
    const result = impact({ teams: [four, melee] })
    expect(result.rows).toEqual([])
  })

  it("does not list an unlock that reaches no new battle (37,272.4)", () => {
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
      teamEffectivePower(five.memberUnitIds, unlocked, WORKED_CONFIG)
    ).toBeCloseTo(37272.4, 6)
    const result = impact({ teams: [five], roster })
    expect(result.rows.some((row) => row.step.kind === "unlock")).toBe(false)
  })

  it("reports every team of the lane holding a unit", () => {
    const result = impact({
      teams: [four, { ...four, id: "copy", manualDepth: 4 }],
    })
    const tigurius = result.rows.find((row) => row.unitId === "ultraTigurius")
    // Copy's 4 → 5 adds nothing Four does not already reach; Four's 5 → 6 adds 148.
    expect(tigurius?.gainPoints).toBe(148)
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
      expect(row.gainPoints).toBe(148)
      expect(row.teams).toEqual([
        { teamId: "four", depthBefore: 5, depthAfter: 6 },
      ])
    }
  })

  it("caps the moved depth at the lane's battle count", () => {
    // Legendary:RedFourStars Gold3: estimated 6, and a rank step reaches battle 7.
    const roster = new Map(
      FOUR_MEMBERS.map((unitId) => [
        unitId,
        { ...rosterUnit(unitId, "Legendary:RedFourStars"), rank: "Gold3" },
      ])
    ) as UpgradeImpactInput["roster"]
    expect(impact({ roster }).rows.length).toBeGreaterThan(0)
    const atLastBattle = impact({
      roster,
      teams: [{ ...four, manualDepth: UTHAR_ALPHA_POWERS.length }],
    })
    expect(atLastBattle.rows).toEqual([])
  })

  it("moves a stored depth from a null estimate when an unlock makes the team estimable", () => {
    // Every member locked: no estimate; the stored depth 2 moves by the unlocked estimate.
    const result = impact({
      roster: new Map(),
      teams: [{ ...four, manualDepth: 2 }],
    })
    const calgar = result.rows.find((row) => row.unitId === "ultraCalgar")
    expect(calgar?.step.kind).toBe("unlock")
    expect(calgar?.gainPoints).toBe(140)
    expect(calgar?.teams).toEqual([
      { teamId: "four", depthBefore: 2, depthAfter: 3 },
    ])
  })

  it("reads a missing estimate as depth 0", () => {
    const result = impact({ battlePowers: [] })
    expect(result.baselinePoints).toBe(0)
    expect(result.rows).toEqual([])
  })
})
