import { describe, expect, it } from "vitest"

import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"

import {
  UTHAR_ALPHA_MODEL,
  UTHAR_ALPHA_POWERS,
  UTHAR_ALPHA_PROGRESS,
  WORKED_CONFIG,
  rosterOf,
} from "./clear-estimate.fixtures"
import { laneRosterPotential, potentialCellStates } from "./roster-potential"

const ULTRAMARINES = 0
const RESILIENT = 1
const MELEE = 3
const PIERCING = 4

const units = legendaryEventCharacters.filter((unit) =>
  unit.id.startsWith("ultra")
)
const roster = rosterOf([
  "ultraCalgar",
  "ultraTigurius",
  "ultraTitus",
  "ultraApothecary",
  "ultraEliminatorSgt",
])
const potentialOf = (overrides = {}) =>
  laneRosterPotential({
    lane: utharEvent.alpha,
    units,
    model: UTHAR_ALPHA_MODEL,
    progress: UTHAR_ALPHA_PROGRESS,
    battlePowers: UTHAR_ALPHA_POWERS,
    roster,
    config: WORKED_CONFIG,
    ...overrides,
  })

describe("laneRosterPotential (spec worked example)", () => {
  it("reaches battle 6 with 1,386 of 8,745 points left on Uthar Alpha", () => {
    expect(potentialOf()).toEqual({
      defeatAllDepth: 6,
      // Ultramarines (all five), Resilient (none), Max 2 Hits (four: E 80,346.4), Melee (three:
      // E 68,311), Piercing (none).
      objectiveDepths: [6, 0, 5, 5, 0],
      pointsLeft: 1386,
      lanePointsLeft: 8745,
      fallsBehindBattle: 7,
      uncoveredObjectiveIndexes: [RESILIENT, PIERCING],
    })
  })

  it("needs three units for an objective", () => {
    const potential = potentialOf({
      roster: rosterOf(["ultraCalgar", "ultraTitus", "ultraTigurius"]),
    })
    // Only Calgar and Titus of these three fit Melee.
    expect(potential.objectiveDepths[MELEE]).toBe(0)
    expect(potential.uncoveredObjectiveIndexes).toContain(MELEE)
  })

  it("is zero everywhere with nothing owned", () => {
    expect(potentialOf({ roster: new Map() })).toMatchObject({
      defeatAllDepth: 0,
      objectiveDepths: [0, 0, 0, 0, 0],
      pointsLeft: 0,
      fallsBehindBattle: 1,
    })
  })

  it("leaves out an owned unit without power data", () => {
    // A copy of Calgar the power tables do not know, like a newly released character.
    const newcomer = {
      ...units.find((unit) => unit.id === "ultraCalgar")!,
      id: "ultraNewcomer",
    }
    const potential = potentialOf({
      lane: {
        ...utharEvent.alpha,
        availableUnitIds: [...utharEvent.alpha.availableUnitIds, newcomer.id],
      },
      units: [...units, newcomer],
      roster: new Map([...roster, ...rosterOf([newcomer.id])]),
    })
    expect(potential.objectiveDepths).toEqual([6, 0, 5, 5, 0])
    expect(potential.uncoveredObjectiveIndexes).toEqual([RESILIENT, PIERCING])
  })

  it("reaches no battle without power data", () => {
    const potential = potentialOf({
      config: { ...WORKED_CONFIG, unitPower: null },
    })
    expect(potential.defeatAllDepth).toBe(0)
  })
})

describe("potentialCellStates", () => {
  const melee = { depth: 5, coveredObjectiveIndexes: [ULTRAMARINES, MELEE] }
  const cells = potentialCellStates(
    UTHAR_ALPHA_MODEL,
    UTHAR_ALPHA_PROGRESS,
    potentialOf(),
    [melee]
  )

  it("puts cleared before a team's reach", () => {
    expect(cells[0]!.slice(0, 2)).toEqual(["cleared", "cleared"])
    expect(cells[0]![1 + MELEE]).toBe("teams")
  })

  it("shows the roster's reach where no team goes", () => {
    // Battle 6: Melee's depth 5 stops at battle 5; the roster still wins it with Ultramarines.
    expect(cells[5]!.slice(0, 2)).toEqual(["roster", "roster"])
    expect(cells[5]![1 + MELEE]).toBe("out")
    expect(cells[4]![1 + 2]).toBe("roster")
  })

  it("is out of reach past every depth and for uncovered objectives", () => {
    expect(cells[6]!.every((state) => state === "out")).toBe(true)
    expect(cells[2]![1 + RESILIENT]).toBe("out")
    expect(cells[2]![1 + PIERCING]).toBe("out")
  })

  it("marks what only the planned goals reach", () => {
    const potential = potentialOf()
    const upgraded = potentialCellStates(
      UTHAR_ALPHA_MODEL,
      UTHAR_ALPHA_PROGRESS,
      potential,
      [melee],
      {
        defeatAllDepth: potential.defeatAllDepth + 1,
        objectiveDepths: potential.objectiveDepths,
      }
    )
    expect(upgraded[6]![0]).toBe("goals")
    expect(upgraded[6]![1 + MELEE]).toBe("out")
    expect(upgraded[5]!.slice(0, 2)).toEqual(["roster", "roster"])
  })
})
