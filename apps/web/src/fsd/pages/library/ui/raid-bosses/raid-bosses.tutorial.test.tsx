import { renderHook } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

import enLibrary from "../../../../../../public/locales/en/library.json"

import { useRaidBossesTutorial } from "./raid-bosses.tutorial"

const tourSteps = enLibrary.raidBosses.tour.steps
const copy = (...keys: (keyof typeof tourSteps)[]) =>
  keys.map((key) => ({
    title: tourSteps[key].title,
    content: tourSteps[key].content,
  }))

vi.mock("@/shared/tour", () => ({}))

describe("useRaidBossesTutorial", () => {
  it("covers the season reference when no boss is open", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("details", false))

    for (const set of [result.current.desktop, result.current.mobile ?? []]) {
      expect(set.map((step) => step.target)).toEqual([
        '[data-testid="raid-boss-tabs"]',
        '[data-testid="raid-boss-season-reference"]',
      ])
    }
  })

  it("covers a boss's page on both forms", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("details"))

    for (const set of [result.current.desktop, result.current.mobile ?? []]) {
      expect(set.map((step) => step.target)).toEqual([
        '[data-testid="raid-boss-tabs"]',
        '[data-testid="raid-boss-progression"]',
        '[data-testid="raid-boss-prime-modifiers"]',
        '[data-testid="raid-boss-adjusted-stats"]',
      ])
      expect(set.map(({ title, content }) => ({ title, content }))).toEqual(
        copy("tabs", "progression", "primeModifiers", "adjustedStats")
      )
    }
  })

  it("guides the season-reference landing page", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("seasons", false))

    expect(result.current.desktop.map((step) => step.target)).toEqual([
      '[data-testid="raid-boss-tabs"]',
      '[data-testid="raid-boss-season-reference"]',
    ])
  })

  it.each([
    [
      "seasons",
      ["raid-boss-tabs", "raid-boss-season-select", "raid-boss-season-content"],
    ],
    [
      "meta",
      [
        "raid-boss-tabs",
        "raid-boss-meta-recommendations",
        "raid-boss-meta-filter",
        "raid-boss-meta-comps",
      ],
    ],
  ] as const)("targets the active %s tab", (tab, testIds) => {
    const { result } = renderHook(() => useRaidBossesTutorial(tab))

    for (const set of [result.current.desktop, result.current.mobile ?? []]) {
      expect(set.map((step) => step.target)).toEqual(
        testIds.map((testId) => `[data-testid="${testId}"]`)
      )
    }
  })
})
