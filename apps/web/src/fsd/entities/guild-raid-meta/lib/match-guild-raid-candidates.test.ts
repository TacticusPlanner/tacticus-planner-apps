import { describe, expect, it } from "vitest"

import {
  matchGuildRaidCandidates,
  type GuildRaidMatcherAssignment,
  type GuildRaidMatcherSlot,
} from "./match-guild-raid-candidates"

function slot(
  overrides: Partial<GuildRaidMatcherSlot> & { heroId: string }
): GuildRaidMatcherSlot {
  return { essential: false, replacementCharacterIds: [], ...overrides }
}

function readinessTable(levels: Record<string, number>) {
  return (characterId: string) => levels[characterId] ?? 0
}

function filledCounts(
  slots: readonly GuildRaidMatcherSlot[],
  assignments: readonly (GuildRaidMatcherAssignment | null)[]
) {
  let essential = 0
  let total = 0
  assignments.forEach((assignment, index) => {
    if (!assignment) return
    total += 1
    if (slots[index]!.essential) essential += 1
  })
  return { essential, total }
}

describe("matchGuildRaidCandidates", () => {
  it("locks a slot whose ideal hero is owned, never consulting its replacement pool", () => {
    const slots = [
      slot({
        heroId: "ideal",
        essential: true,
        replacementCharacterIds: ["shouldNeverBeUsed"],
      }),
    ]
    const result = matchGuildRaidCandidates({
      slots,
      ownedCharacterIds: new Set(["ideal", "shouldNeverBeUsed"]),
      readinessOf: readinessTable({}),
    })

    expect(result.assignments).toEqual([
      { characterId: "ideal", isIdeal: true },
    ])
    expect(filledCounts(slots, result.assignments)).toEqual({
      essential: 1,
      total: 1,
    })
  })

  it("fills an open slot from its explicit replacement list when the ideal hero is unowned", () => {
    const slots = [
      slot({ heroId: "missing", replacementCharacterIds: ["alt1", "alt2"] }),
    ]
    const result = matchGuildRaidCandidates({
      slots,
      ownedCharacterIds: new Set(["alt2"]),
      readinessOf: readinessTable({}),
    })

    expect(result.assignments).toEqual([
      { characterId: "alt2", isIdeal: false },
    ])
    expect(filledCounts(slots, result.assignments).total).toBe(1)
  })

  it("leaves a slot unfilled when the player owns none of its replacements", () => {
    const slots = [
      slot({ heroId: "missing", replacementCharacterIds: ["alt1"] }),
    ]
    const result = matchGuildRaidCandidates({
      slots,
      ownedCharacterIds: new Set(),
      readinessOf: readinessTable({}),
    })

    expect(result.assignments).toEqual([null])
    expect(filledCounts(slots, result.assignments).total).toBe(0)
  })

  it("never assigns the same owned candidate to two slots at once", () => {
    const slots = [
      slot({ heroId: "missingA", replacementCharacterIds: ["shared"] }),
      slot({ heroId: "missingB", replacementCharacterIds: ["shared"] }),
    ]
    const result = matchGuildRaidCandidates({
      slots,
      ownedCharacterIds: new Set(["shared"]),
      readinessOf: readinessTable({}),
    })

    const usedIds = result.assignments
      .filter((assignment) => assignment !== null)
      .map((assignment) => assignment!.characterId)
    expect(new Set(usedIds).size).toBe(usedIds.length)
    expect(filledCounts(slots, result.assignments).total).toBe(1)
  })

  it("reserves the only shared candidate for the essential slot over an equally eligible flex slot", () => {
    const slots = [
      slot({
        heroId: "missingFlex",
        essential: false,
        replacementCharacterIds: ["shared"],
      }),
      slot({
        heroId: "missingEssential",
        essential: true,
        replacementCharacterIds: ["shared"],
      }),
    ]
    const result = matchGuildRaidCandidates({
      slots,
      ownedCharacterIds: new Set(["shared"]),
      // Readiness favors the flex slot's outcome if it were consulted — essential priority must still win.
      readinessOf: readinessTable({ shared: 100 }),
    })

    expect(result.assignments[0]).toBeNull()
    expect(result.assignments[1]).toEqual({
      characterId: "shared",
      isIdeal: false,
    })
    expect(filledCounts(slots, result.assignments)).toEqual({
      essential: 1,
      total: 1,
    })
  })

  it("maximizes filled essential slots even when it leaves more total slots unfilled than an alternative", () => {
    // Three essential slots whose only owned option is the same two-candidate pool: only two of the
    // three essential slots can ever be filled, and a fourth (flex) slot has its own dedicated
    // candidate. An assignment that filled the flex slot at an essential slot's expense would raise
    // total-filled but must lose to one that fills more essential slots.
    const slots = [
      slot({
        heroId: "e1",
        essential: true,
        replacementCharacterIds: ["poolA", "poolB"],
      }),
      slot({
        heroId: "e2",
        essential: true,
        replacementCharacterIds: ["poolA", "poolB"],
      }),
      slot({
        heroId: "e3",
        essential: true,
        replacementCharacterIds: ["poolA", "poolB"],
      }),
      slot({
        heroId: "f1",
        essential: false,
        replacementCharacterIds: ["flexOnly"],
      }),
    ]
    const result = matchGuildRaidCandidates({
      slots,
      ownedCharacterIds: new Set(["poolA", "poolB", "flexOnly"]),
      readinessOf: readinessTable({}),
    })

    expect(filledCounts(slots, result.assignments)).toEqual({
      essential: 2,
      total: 3,
    })
    const essentialAssignments = result.assignments.slice(0, 3).filter(Boolean)
    expect(essentialAssignments).toHaveLength(2)
  })

  it("tie-breaks between equally-filling candidates by investment-readiness percentage", () => {
    const result = matchGuildRaidCandidates({
      slots: [
        slot({
          heroId: "missing",
          replacementCharacterIds: ["lowReadiness", "highReadiness"],
        }),
      ],
      ownedCharacterIds: new Set(["lowReadiness", "highReadiness"]),
      readinessOf: readinessTable({ lowReadiness: 20, highReadiness: 90 }),
    })

    expect(result.assignments).toEqual([
      { characterId: "highReadiness", isIdeal: false },
    ])
  })

  it.each([
    { essential: [true, false], filledEssential: 1 },
    { essential: [false, true], filledEssential: 1 },
    { essential: [true, true], filledEssential: 1 },
    { essential: [false, false], filledEssential: 0 },
  ])(
    "fills exactly one of two slots sharing a single candidate regardless of essential pattern $essential",
    ({ essential, filledEssential }) => {
      const slots = essential.map((isEssential, i) =>
        slot({
          heroId: `missing${i}`,
          essential: isEssential,
          replacementCharacterIds: ["onlyCandidate"],
        })
      )
      const result = matchGuildRaidCandidates({
        slots,
        ownedCharacterIds: new Set(["onlyCandidate"]),
        readinessOf: readinessTable({}),
      })

      expect(filledCounts(slots, result.assignments)).toEqual({
        essential: filledEssential,
        total: 1,
      })
    }
  )
})
