import { describe, expect, it } from "vitest"

import { validateDisplayName } from "./display-name"

describe("validateDisplayName", () => {
  it.each([
    ["Ada", null],
    ["  Ada  ", null],
    ["a".repeat(80), null],
    ["", "empty"],
    ["   ", "empty"],
    ["a".repeat(81), "tooLong"],
    ["bad\u0007name", "controlCharacters"],
    ["line\nbreak", "controlCharacters"],
  ] as const)("%j -> %s", (input, expected) => {
    expect(validateDisplayName(input)).toBe(expected)
  })
})
