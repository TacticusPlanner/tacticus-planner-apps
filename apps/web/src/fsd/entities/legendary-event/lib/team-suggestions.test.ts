import { describe, expect, it } from "vitest"

import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharEvent } from "@/test/fixtures/legendary-events"

import {
  UTHAR_ALPHA_MODEL,
  UTHAR_ALPHA_POWERS,
  UTHAR_ALPHA_PROGRESS,
  WORKED_CONFIG,
  rosterOf,
  rosterUnit,
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

  describe("support (spec: Support)", () => {
    const plain = [
      "ultraCalgar",
      "ultraTigurius",
      "ultraTitus",
      "ultraEliminatorSgt",
      "ultraInceptorSgt",
    ]
    const ultramarinesTeam = (
      overrides: Partial<TeamSuggestionsInput>
    ): string[] | undefined =>
      suggest(overrides).find(
        (suggestion) =>
          suggestion.objectiveIndexes.length === 1 &&
          suggestion.objectiveIndexes[0] === ULTRAMARINES
      )?.memberUnitIds

    const heldWithHealerAt = (rank: "Stone1" | "Silver3") =>
      new Map([
        ...rosterOf(plain),
        ["ultraApothecary", { ...rosterUnit("ultraApothecary"), rank }],
      ])

    it("swaps a held Healer in for the weakest plain member when the depth holds", () => {
      // Incisus (Healer) at Silver 3 is the weakest of six held Ultramarines; the team still
      // clears ~6 with it in place of the weakest plain member.
      const members = ultramarinesTeam({ roster: heldWithHealerAt("Silver3") })
      expect(members).toHaveLength(5)
      expect(members).toContain("ultraApothecary")
    })

    it("keeps the stronger member when the Healer would lower the depth", () => {
      // Incisus at Stone 1 would drop the team from ~6 to ~5 (UserJot: LRE team picks favour
      // weaker healers).
      expect(
        ultramarinesTeam({ roster: heldWithHealerAt("Stone1") })?.toSorted()
      ).toEqual(plain.toSorted())
    })

    it("does not swap in a Healer the player does not hold", () => {
      const members = ultramarinesTeam({
        roster: rosterOf(plain),
        onlyUnlocked: false,
      })
      expect(members).toBeDefined()
      expect(members).not.toContain("ultraApothecary")
    })
  })

  it("proposes nothing when power data is unavailable (every depth reads 0)", () => {
    expect(suggest({ config: { ...WORKED_CONFIG, unitPower: null } })).toEqual(
      []
    )
  })
})

describe("suggestLaneTeams (objectives already cleared)", () => {
  // Ultramarines cleared in battles 1..through, everything else as in the worked example.
  const ultramarinesClearedThrough = (through: number) => ({
    ...UTHAR_ALPHA_PROGRESS,
    battles: UTHAR_ALPHA_PROGRESS.battles.map((battle) =>
      battle.index < through
        ? {
            ...battle,
            cleared: battle.cleared.map((isCleared, column) =>
              column === ULTRAMARINES + 1 ? true : isCleared
            ),
          }
        : battle
    ),
  })

  it("drops the {Ultramarines} proposal when Ultramarines is cleared through its depth 6", () => {
    const subsets = suggest({ progress: ultramarinesClearedThrough(6) }).map(
      (suggestion) => suggestion.objectiveIndexes
    )
    expect(subsets).not.toContainEqual([ULTRAMARINES])
    expect(subsets).toContainEqual([MELEE])
  })

  it("keeps it when battle 6 still has Ultramarines open", () => {
    const subsets = suggest({ progress: ultramarinesClearedThrough(5) }).map(
      (suggestion) => suggestion.objectiveIndexes
    )
    expect(subsets).toContainEqual([ULTRAMARINES])
  })

  it("keeps the member set free when a subset is dropped, so {Melee} with the same members is proposed", () => {
    const four = new Set([
      "ultraApothecary",
      "ultraTitus",
      "ultraCalgar",
      "ultraInceptorSgt",
    ])
    const subsets = suggest({
      units: units.filter((unit) => four.has(unit.id)),
      onlyUnlocked: false,
      progress: ultramarinesClearedThrough(UTHAR_ALPHA_PROGRESS.battles.length),
    }).map((suggestion) => suggestion.objectiveIndexes)
    expect(subsets).not.toContainEqual([ULTRAMARINES])
    expect(subsets).toContainEqual([MELEE])
  })
})

describe("suggestLaneTeams (three-objective subsets)", () => {
  // Titus at two melee hits joins Max 2 Hits: {Max 2 Hits, Melee} then has Incisus, Titus and
  // Calgar, who all satisfy Ultramarines too.
  const widened = units.map((unit) =>
    unit.id === "ultraTitus" ? { ...unit, meleeHits: 2 } : unit
  )
  const TRIPLE = ["ultraApothecary", "ultraTitus", "ultraCalgar"]
  const triple = (overrides: Partial<TeamSuggestionsInput>) =>
    suggest({ units: widened, ...overrides }).find(
      (suggestion) => suggestion.memberUnitIds.join() === TRIPLE.join()
    )

  it("proposes a team covering three objectives", () => {
    expect(triple({})?.coveredObjectiveIndexes).toEqual([
      ULTRAMARINES,
      MAX_2_HITS,
      MELEE,
    ])
  })

  it("keeps a proposal that adds no points but saves tokens", () => {
    // Two existing teams split the three objectives over battles 1–5: two tokens per battle.
    const proposal = triple({
      existingTeams: [
        {
          memberUnitIds: ["a", "b", "c"],
          depth: 5,
          coveredObjectiveIndexes: [ULTRAMARINES, MELEE],
        },
        {
          memberUnitIds: ["d", "e", "f"],
          depth: 5,
          coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS],
        },
      ],
    })
    expect(proposal).toMatchObject({ depth: 5, gainPoints: 0 })
    expect(proposal?.tokensSaved).toBe(5)
  })

  it("lists a three-objective proposal with no gain last, at 0 points and 0 tokens", () => {
    const existingTeams = [
      {
        memberUnitIds: ["a", "b", "c"],
        depth: 5,
        coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS, MELEE],
      },
    ]
    const suggestions = suggest({ units: widened, existingTeams })
    expect(suggestions.at(-1)).toMatchObject({
      memberUnitIds: TRIPLE,
      gainPoints: 0,
      tokensSaved: 0,
    })
    expect(
      suggestions
        .slice(0, -1)
        .every(
          (suggestion) =>
            suggestion.gainPoints > 0 || suggestion.tokensSaved > 0
        )
    ).toBe(true)
  })

  it("drops a no-gain proposal covering fewer than three open objectives", () => {
    // Ultramarines cleared everywhere leaves the triple two open objectives.
    const progress = {
      ...UTHAR_ALPHA_PROGRESS,
      battles: UTHAR_ALPHA_PROGRESS.battles.map((battle) => ({
        ...battle,
        cleared: battle.cleared.map((isCleared, column) =>
          column === ULTRAMARINES + 1 ? true : isCleared
        ),
      })),
    }
    expect(
      triple({
        progress,
        existingTeams: [
          {
            memberUnitIds: ["a", "b", "c"],
            depth: 5,
            coveredObjectiveIndexes: [ULTRAMARINES, MAX_2_HITS, MELEE],
          },
        ],
      })
    ).toBeUndefined()
  })
})
