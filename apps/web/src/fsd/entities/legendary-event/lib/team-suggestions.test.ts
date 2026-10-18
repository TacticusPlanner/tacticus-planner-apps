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

// Candidates in effective-power order: Incisus 24,753, Titus 21,883, Calgar 21,675, Tigurius
// 16,672 × 1.2 = 20,006.4, Certus 13,912.
const MELEE_TEAM = ["ultraApothecary", "ultraTitus", "ultraCalgar"]

describe("suggestLaneTeams (spec worked examples)", () => {
  it("ranks the worked Uthar Alpha proposals: 945, 870, 811", () => {
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
      // E 68,311: 65 + 140 + 240 + 248 + 252
      {
        memberUnitIds: MELEE_TEAM,
        coveredObjectiveIndexes: [ULTRAMARINES, MELEE],
        depth: 5,
        gainPoints: 945,
      },
      // E 80,346.4: 50 + 125 + 225 + 233 + 237
      {
        memberUnitIds: [
          "ultraApothecary",
          "ultraCalgar",
          "ultraTigurius",
          "ultraEliminatorSgt",
        ],
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS],
        depth: 5,
        gainPoints: 870,
      },
      // E 102,229.4: 0 + 75 + 175 + 183 + 187 + 191
      {
        memberUnitIds: [
          "ultraApothecary",
          "ultraTitus",
          "ultraCalgar",
          "ultraTigurius",
          "ultraEliminatorSgt",
        ],
        coveredObjectiveIndexes: [ULTRAMARINES],
        depth: 6,
        gainPoints: 811,
      },
    ])
  })

  it("proposes no team for a subset with fewer than three candidates", () => {
    const subsets = suggest().map((suggestion) =>
      suggestion.objectiveIndexes.join()
    )
    // {Piercing}: Incisus alone; {Max 2 Hits, Melee}: Incisus and Calgar.
    expect(subsets).not.toContain(String(PIERCING))
    expect(subsets).not.toContain([MAX_2_HITS, MELEE].join())
    expect(
      suggest().every((suggestion) => suggestion.memberUnitIds.length >= 3)
    ).toBe(true)
  })

  it("re-ranks after the Melee proposal is saved: 250, 191", () => {
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
      250, 191,
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
      "ultraApothecary",
      "ultraCalgar",
      "ultraTigurius",
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

  it("proposes nothing when power data is unavailable (every depth reads 0)", () => {
    expect(suggest({ config: { ...WORKED_CONFIG, unitPower: null } })).toEqual(
      []
    )
  })
})
