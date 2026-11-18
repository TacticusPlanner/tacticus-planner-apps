import { renderHook } from "@testing-library/react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"

import {
  useNpcTierListTutorial,
  useTierListTutorial,
} from "./tier-list.tutorial"

let i18n: I18n

const render = (flags: Parameters<typeof useTierListTutorial>[0]) =>
  renderHook(() => useTierListTutorial(flags), {
    wrapper: i18nWrapper(i18n),
  }).result.current

describe("useTierListTutorial", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("lists the intro, the S row, the first tile and the filters on both forms", () => {
    const steps = render({ hasRow: true, hasTile: true, hasFilters: true })
    for (const form of [steps.desktop, steps.mobile ?? []]) {
      expect(form.map((step) => step.target)).toEqual([
        '[data-testid="tier-list-kind"]',
        '[data-testid="tier-list-row-S"]',
        '[data-testid="tier-list-first-tile"]',
        '[data-testid="tier-list-filters"]',
      ])
      expect(form.map((step) => step.title)).toEqual([
        "Heroes",
        "Tier rows",
        "A character",
        "Filters",
      ])
      for (const step of form) expect(step.content).not.toBe("")
    }
    // The page help that used to sit above the list now opens the tour.
    expect(steps.desktop[0]?.content).toBe(
      "Horde-mode tiers for every character, with the multiplier each one gets. A character's multiplier scales its combat power in the Legendary Event clear estimates. Tiered characters use their own multiplier when they have one, otherwise their tier's; untiered characters use 1.0."
    )
    expect(steps.desktop[2]?.placement).toBe("right")
    expect(steps.mobile?.[2]?.placement).toBe("bottom")
  })

  it("leaves out the steps whose targets are not rendered", () => {
    const steps = render({ hasRow: true, hasTile: false, hasFilters: true })
    expect(steps.mobile?.map((step) => step.target)).toEqual([
      '[data-testid="tier-list-kind"]',
      '[data-testid="tier-list-row-S"]',
      '[data-testid="tier-list-filters"]',
    ])
    expect(
      render({ hasRow: false, hasTile: false, hasFilters: false }).desktop.map(
        (step) => step.target
      )
    ).toEqual(['[data-testid="tier-list-kind"]'])
  })

  it("has German copy", async () => {
    const de = await createTestI18n("de")
    const { result } = renderHook(
      () =>
        useTierListTutorial({ hasRow: true, hasTile: true, hasFilters: true }),
      { wrapper: i18nWrapper(de) }
    )
    expect(result.current.desktop[1]?.title).toBe("Tier-Zeilen")
  })
})

describe("useNpcTierListTutorial", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("explains the Enemies list on the tabs, then the filters once shown", () => {
    const { result } = renderHook(
      () => useNpcTierListTutorial({ hasFilters: true }),
      { wrapper: i18nWrapper(i18n) }
    )
    for (const form of [result.current.desktop, result.current.mobile ?? []]) {
      expect(form.map((step) => step.target)).toEqual([
        '[data-testid="tier-list-kind"]',
        '[data-testid="npc-tier-list-toolbar"]',
      ])
      expect(form.map((step) => step.title)).toEqual(["Enemies", "Filters"])
      for (const step of form) expect(step.content).not.toBe("")
    }
    const { result: loading } = renderHook(
      () => useNpcTierListTutorial({ hasFilters: false }),
      { wrapper: i18nWrapper(i18n) }
    )
    expect(loading.current.desktop.map((step) => step.target)).toEqual([
      '[data-testid="tier-list-kind"]',
    ])
  })
})
