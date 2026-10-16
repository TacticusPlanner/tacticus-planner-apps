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
  it("ranks the worked Uthar Alpha proposals: 945, 893, 870, 865, 811", () => {
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
      // 65 + 140 + 240 + 248 + 252
      {
        memberUnitIds: MELEE_TEAM,
        coveredObjectiveIndexes: [ULTRAMARINES, MELEE],
        depth: 5,
        gainPoints: 945,
      },
      // 115 + 190 + 290 + 298
      {
        memberUnitIds: ["ultraApothecary", "ultraCalgar"],
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS, MELEE],
        depth: 4,
        gainPoints: 893,
      },
      // 50 + 125 + 225 + 233 + 237
      {
        memberUnitIds: [
          "ultraTigurius",
          "ultraApothecary",
          "ultraCalgar",
          "ultraEliminatorSgt",
        ],
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS],
        depth: 5,
        gainPoints: 870,
      },
      // 205 + 280 + 380
      {
        memberUnitIds: ["ultraApothecary"],
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS, MELEE, PIERCING],
        depth: 3,
        gainPoints: 865,
      },
      // 0 + 75 + 175 + 183 + 187 + 191
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
        gainPoints: 811,
      },
    ])
  })

  it("re-ranks after the Melee proposal is saved: 420, 250, 200, 191", () => {
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
      420, 250, 200, 191,
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
