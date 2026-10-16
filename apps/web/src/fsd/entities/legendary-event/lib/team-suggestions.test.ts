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
import { suggestLaneTeams, type TeamSuggestionsInput } from "./team-suggestions"

const ULTRAMARINES = 0
const MAX_2_HITS = 2
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

const suggest = (overrides: Partial<TeamSuggestionsInput> = {}) =>
  suggestLaneTeams({
    lane: utharEvent.alpha,
    units,
    model: UTHAR_ALPHA_MODEL,
    progress: UTHAR_ALPHA_PROGRESS,
    existingTeams: [],
    battlePowers: UTHAR_ALPHA_POWERS,
    roster,
    config: WORKED_CONFIG,
    onlyUnlocked: true,
    preferGoals: false,
    goalUnitIds: new Set(),
    nameOf: (unit) => unit.name,
    ...overrides,
  })

const MELEE_TEAM = ["ultraApothecary", "ultraCalgar", "ultraTitus"]

describe("suggestLaneTeams (spec worked examples)", () => {
  it("ranks the worked Uthar Alpha proposals: 830, 830, 819, 755, 653", () => {
    expect(
      suggest().map(
        ({ memberUnitIds, coveredObjectiveIndexes, depth, gainPoints }) => ({
          memberUnitIds,
          coveredObjectiveIndexes,
          depth,
          gainPoints,
        })
      )
    ).toEqual([
      {
        memberUnitIds: MELEE_TEAM,
        coveredObjectiveIndexes: [ULTRAMARINES, MELEE],
        depth: 5,
        gainPoints: 830,
      },
      {
        memberUnitIds: ["ultraApothecary"],
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS, MELEE, PIERCING],
        depth: 3,
        gainPoints: 830,
      },
      {
        memberUnitIds: ["ultraApothecary", "ultraCalgar"],
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS, MELEE],
        depth: 4,
        gainPoints: 819,
      },
      {
        memberUnitIds: [
          "ultraTigurius",
          "ultraApothecary",
          "ultraCalgar",
          "ultraEliminatorSgt",
        ],
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS],
        depth: 5,
        gainPoints: 755,
      },
      {
        memberUnitIds: [
          "ultraTigurius",
          "ultraApothecary",
          "ultraCalgar",
          "ultraTitus",
          "ultraEliminatorSgt",
        ],
        coveredObjectiveIndexes: [ULTRAMARINES],
        depth: 6,
        gainPoints: 653,
      },
    ])
  })

  it("re-ranks after the Melee proposal is saved: 420, 250, 200, 148", () => {
    const suggestions = suggest({
      existingTeams: [
        {
          memberUnitIds: MELEE_TEAM,
          depth: 5,
          coveredObjectiveIndexes: [ULTRAMARINES, MELEE],
        },
      ],
    })
    expect(suggestions.map((suggestion) => suggestion.gainPoints)).toEqual([
      420, 250, 200, 148,
    ])
    expect(
      suggestions.some(
        (suggestion) => suggestion.memberUnitIds.join() === MELEE_TEAM.join()
      )
    ).toBe(false)
  })

  it("merges subsets with the same members into one proposal", () => {
    const keys = suggest().map((suggestion) =>
      [...suggestion.memberUnitIds].sort().join("|")
    )
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("puts units with goals first while Prefer units with goals is on", () => {
    const [ultramarines] = suggest({
      preferGoals: true,
      goalUnitIds: new Set(["ultraEliminatorSgt", "ultraTitus"]),
    }).filter((suggestion) => suggestion.objectiveIndexes.join() === "0")
    expect(ultramarines?.memberUnitIds).toEqual([
      "ultraTitus",
      "ultraEliminatorSgt",
      "ultraTigurius",
      "ultraApothecary",
      "ultraCalgar",
    ])
  })

  it("can propose a locked unit while Only unlocked is off", () => {
    const suggestions = suggest({ onlyUnlocked: false })
    expect(
      suggestions.some((suggestion) =>
        suggestion.memberUnitIds.includes("ultraInceptorSgt")
      )
    ).toBe(true)
    expect(
      suggest().some((suggestion) =>
        suggestion.memberUnitIds.includes("ultraInceptorSgt")
      )
    ).toBe(false)
  })
})
