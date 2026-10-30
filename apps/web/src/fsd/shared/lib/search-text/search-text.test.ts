import { describe, expect, it } from "vitest"

import {
  anyNameIncludes,
  matchesSearch,
  normalizeSearchText,
} from "./search-text"

describe("normalizeSearchText", () => {
  it("lowercases, strips diacritics and drops punctuation and spaces", () => {
    expect(normalizeSearchText("Âmmuk")).toBe("ammuk")
    expect(normalizeSearchText("Z'Kar")).toBe("zkar")
    expect(normalizeSearchText("Kîmm")).toBe("kimm")
    expect(normalizeSearchText("Lord Uriel-Ventris")).toBe("lordurielventris")
  })
})

describe("matchesSearch", () => {
  it("finds names with accents or apostrophes from plain typing", () => {
    expect(matchesSearch("Âmmuk", "amm")).toBe(true)
    expect(matchesSearch("Z'Kar", "zka")).toBe(true)
    expect(matchesSearch("Z'Kar", "z'k")).toBe(true)
    expect(matchesSearch("Ammuk", "âmm")).toBe(true)
  })

  it("ignores spacing differences", () => {
    expect(matchesSearch("Lord Uriel", "lordur")).toBe(true)
    expect(matchesSearch("Ragnar", "rag nar")).toBe(true)
  })

  it("rejects non-matches", () => {
    expect(matchesSearch("Z'Kar", "kaz")).toBe(false)
  })

  it("matches everything for a blank or punctuation-only query", () => {
    expect(matchesSearch("Ragnar", "")).toBe(true)
    expect(matchesSearch("Ragnar", "  '  ")).toBe(true)
  })
})

describe("anyNameIncludes", () => {
  it("matches a normalized needle against any of the names", () => {
    const names = ["Nauseous", "Nauseous Rotbone"]
    expect(anyNameIncludes(names, normalizeSearchText("rotbone"))).toBe(true)
    expect(anyNameIncludes(names, "nau")).toBe(true)
    expect(anyNameIncludes(names, "typhus")).toBe(false)
    expect(anyNameIncludes([], "nau")).toBe(false)
  })
})
