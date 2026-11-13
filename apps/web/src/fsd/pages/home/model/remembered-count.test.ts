// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"

import {
  homeRememberedCounts,
  rememberCount,
  rememberedCount,
} from "./remembered-count"

const { liveEvents, tokens } = homeRememberedCounts

afterEach(() => {
  window.localStorage.clear()
})

describe("rememberedCount", () => {
  it("falls back before Home has counted", () => {
    expect(rememberedCount(liveEvents)).toBe(2)
    expect(rememberedCount(tokens)).toBe(0)
  })

  it("returns the count Home showed last time", () => {
    rememberCount(liveEvents, 3)

    expect(rememberedCount(liveEvents)).toBe(3)
  })

  it("remembers that there was nothing to show", () => {
    rememberCount(liveEvents, 0)

    expect(rememberedCount(liveEvents)).toBe(0)
  })

  it("remembers a row of token rings", () => {
    rememberCount(tokens, 4)

    expect(rememberedCount(tokens)).toBe(4)
  })

  it("caps a long list and ignores a value it didn't write", () => {
    rememberCount(liveEvents, 40)
    expect(rememberedCount(liveEvents)).toBe(6)

    window.localStorage.setItem(liveEvents.key, "lots")
    expect(rememberedCount(liveEvents)).toBe(2)
  })
})
