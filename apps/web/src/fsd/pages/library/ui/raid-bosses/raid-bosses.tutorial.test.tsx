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
  it("covers the detail view on desktop with the two-section roster", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("details"))

    expect(result.current.desktop.map((step) => step.target)).toEqual([
      '[data-testid="raid-boss-tabs"]',
      '[data-testid="raid-boss-list-bosses"]',
      '[data-testid="raid-boss-list-primes"]',
      '[data-testid="raid-boss-progression"]',
      '[data-testid="raid-boss-prime-modifiers"]',
      '[data-testid="raid-boss-adjusted-stats"]',
    ])
    expect(
      result.current.desktop.map(({ title, content }) => ({ title, content }))
    ).toEqual(
      copy(
        "tabs",
        "bosses",
        "primes",
        "progression",
        "primeModifiers",
        "adjustedStats"
      )
    )
  })

  it("covers the detail view on mobile with the single collapsed picker step", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("details"))

    expect((result.current.mobile ?? []).map((step) => step.target)).toEqual([
      '[data-testid="raid-boss-tabs"]',
      '[data-testid="raid-boss-mobile-picker"]',
      '[data-testid="raid-boss-progression"]',
      '[data-testid="raid-boss-prime-modifiers"]',
      '[data-testid="raid-boss-adjusted-stats"]',
    ])
    expect(
      (result.current.mobile ?? []).map(({ title, content }) => ({
        title,
        content,
      }))
    ).toEqual(
      copy(
        "tabs",
        "mobilePicker",
        "progression",
        "primeModifiers",
        "adjustedStats"
      )
    )
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
