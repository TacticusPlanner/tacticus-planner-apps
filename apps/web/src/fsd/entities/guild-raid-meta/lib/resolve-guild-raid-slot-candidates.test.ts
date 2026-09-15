import { describe, expect, it } from "vitest"

import { resolveGuildRaidSlotCandidates } from "./resolve-guild-raid-slot-candidates"
import type { GuildRaidMatcherSlot } from "./match-guild-raid-candidates"

const slot: GuildRaidMatcherSlot = {
  heroId: "ideal",
  essential: false,
  replacementCharacterIds: ["altA", "altB", "unowned"],
}

describe("resolveGuildRaidSlotCandidates", () => {
  it("exposes every owned candidate, not only the matcher's selected one", () => {
    const candidates = resolveGuildRaidSlotCandidates({
      slot,
      ownedCharacterIds: new Set(["altA", "altB"]),
      readinessOf: (id) => (id === "altA" ? 40 : 90),
      selectedCharacterId: "altA",
    })

    expect(candidates.map((c) => c.characterId)).toEqual(["altA", "altB"])
    expect(candidates.map((c) => c.readiness)).toEqual([40, 90])
    expect(candidates.map((c) => c.isSelected)).toEqual([true, false])
    expect(candidates.every((c) => !c.isIdeal)).toBe(true)
  })

  it("lists the ideal hero first when owned, ahead of authored replacements", () => {
    const candidates = resolveGuildRaidSlotCandidates({
      slot,
      ownedCharacterIds: new Set(["ideal", "altB"]),
      readinessOf: () => 100,
      selectedCharacterId: "ideal",
    })

    expect(candidates.map((c) => c.characterId)).toEqual(["ideal", "altB"])
    expect(candidates[0]!.isIdeal).toBe(true)
  })

  it("omits unowned candidates entirely", () => {
    const candidates = resolveGuildRaidSlotCandidates({
      slot,
      ownedCharacterIds: new Set(["altB"]),
      readinessOf: () => 50,
      selectedCharacterId: "altB",
    })

    expect(candidates.map((c) => c.characterId)).toEqual(["altB"])
  })
})
