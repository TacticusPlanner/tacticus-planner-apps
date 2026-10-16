import { renderHook } from "@testing-library/react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"

import { useTierListTutorial } from "./tier-list.tutorial"

let i18n: I18n

const render = (flags: Parameters<typeof useTierListTutorial>[0]) =>
  renderHook(() => useTierListTutorial(flags), {
    wrapper: i18nWrapper(i18n),
  }).result.current

describe("useTierListTutorial", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("lists the S row, the first tile and the filters on both forms", () => {
    const steps = render({ hasRow: true, hasTile: true, hasFilters: true })
    for (const form of [steps.desktop, steps.mobile ?? []]) {
      expect(form.map((step) => step.target)).toEqual([
        '[data-testid="tier-list-row-S"]',
        '[data-testid="tier-list-first-tile"]',
        '[data-testid="tier-list-filters"]',
      ])
      expect(form.map((step) => step.title)).toEqual([
        "Tier rows",
        "A character",
        "Filters",
      ])
      for (const step of form) expect(step.content).not.toBe("")
    }
    expect(steps.desktop[1]?.placement).toBe("right")
    expect(steps.mobile?.[1]?.placement).toBe("bottom")
  })

  it("leaves out the steps whose targets are not rendered", () => {
    const steps = render({ hasRow: true, hasTile: false, hasFilters: true })
    expect(steps.mobile?.map((step) => step.target)).toEqual([
      '[data-testid="tier-list-row-S"]',
      '[data-testid="tier-list-filters"]',
    ])
    expect(
      render({ hasRow: false, hasTile: false, hasFilters: false }).desktop
    ).toEqual([])
  })

  it("has German copy", async () => {
    const de = await createTestI18n("de")
    const { result } = renderHook(
      () =>
        useTierListTutorial({ hasRow: true, hasTile: true, hasFilters: true }),
      { wrapper: i18nWrapper(de) }
    )
    expect(result.current.desktop[0]?.title).toBe("Tier-Zeilen")
  })
})
