import { describe, expect, it } from "vitest"

import type { CharacterSuggestions, Suggestion } from "./suggestions"
import {
  DEFAULT_SUGGESTIONS_QUERY,
  readSuggestionsQuery,
  visibleSuggestions,
  writeSuggestionsQuery,
} from "./suggestions-query"

const suggestion = (gain: number, locked = false): Suggestion => ({
  slotIndex: 0,
  slotType: "I_Crit",
  locked,
  next: { itemId: "x", level: 1 },
  reason: { kind: "empty" },
  gain,
})

const entry = (
  characterId: string,
  faction: string,
  suggestions: Suggestion[]
): CharacterSuggestions => ({
  characterId,
  faction,
  rarity: "Legendary",
  suggestions,
})

const characters = [
  entry("abaddon", "BlackLegion", [suggestion(1)]),
  entry("calgar", "Ultramarines", [suggestion(300)]),
  entry("tigurius", "Ultramarines", [suggestion(500, true)]),
]

const names: Record<string, string> = {
  abaddon: "Abaddon",
  calgar: "Marneus Calgar",
  tigurius: "Varro Tigurius",
}
const visible = (patch: Partial<typeof DEFAULT_SUGGESTIONS_QUERY>) =>
  visibleSuggestions(
    characters,
    { ...DEFAULT_SUGGESTIONS_QUERY, ...patch },
    { nameOf: (id) => names[id] ?? id, locale: "en" }
  ).map((c) => c.characterId)

describe("suggestions query", () => {
  it("keeps 'Unlocked slots only' on unless the URL turns it off", () => {
    expect(readSuggestionsQuery(new URLSearchParams())).toEqual(
      DEFAULT_SUGGESTIONS_QUERY
    )
    const off = writeSuggestionsQuery(new URLSearchParams(), {
      unlocked: false,
      faction: ["Orks"],
    })
    expect(off.toString()).toBe("unlocked=0&faction=Orks")
    expect(readSuggestionsQuery(off).unlocked).toBe(false)
    expect(writeSuggestionsQuery(off, { unlocked: true }).has("unlocked")).toBe(
      false
    )
  })
})

describe("visibleSuggestions", () => {
  it("lists the characters gaining most first, and hides slots not open yet", () => {
    expect(visible({})).toEqual(["calgar", "abaddon"])
    expect(visible({ unlocked: false })).toEqual([
      "tigurius",
      "calgar",
      "abaddon",
    ])
  })

  it("searches names and filters by faction", () => {
    expect(visible({ q: "CALG" })).toEqual(["calgar"])
    expect(visible({ faction: ["BlackLegion"] })).toEqual(["abaddon"])
  })
})
