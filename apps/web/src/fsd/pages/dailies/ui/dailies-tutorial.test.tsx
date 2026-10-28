import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTodayTutorial } from "./today.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("Dailies tutorials", () => {
  beforeEach(() => register.mockClear())

  it.each([
    [
      "Today",
      useTodayTutorial,
      /^localized:(tour\.today|shops:tour\.shops)\.steps/,
    ],
  ] as const)(
    "registers localized desktop and mobile %s steps",
    (_name, hook, keyPrefix) => {
      renderHook(() => hook())
      const steps = register.mock.lastCall?.[0] as {
        desktop: { target: string; title: string; content: string }[]
        mobile: { target: string; title: string; content: string }[]
      }

      // Only the navigation step differs between platforms.
      expect(steps.desktop.slice(1)).toEqual(steps.mobile.slice(1))
      // No project-selector step: the raid pages plan the whole account.
      expect(steps.desktop.length).toBeGreaterThanOrEqual(3)
      for (const step of [...steps.desktop, ...steps.mobile]) {
        expect(step.target).not.toContain("project")
        expect(step.target).toMatch(
          /^\[data-testid="[a-z-]+"\](, \[data-testid="[a-z-]+"\])*$/
        )
        expect(step.title).toMatch(keyPrefix)
        expect(step.content).toMatch(keyPrefix)
      }
    }
  )

  it("opens on the shell's section menu on desktop and its section tabs on mobile", () => {
    renderHook(() => useTodayTutorial())
    const steps = register.mock.lastCall?.[0] as Record<
      "desktop" | "mobile",
      { target: string; title: string }[]
    >

    for (const viewport of ["desktop", "mobile"] as const) {
      expect(steps[viewport][0]?.title).toBe(
        "localized:tour.today.steps.navigation.title"
      )
    }
    expect(steps.desktop[0]?.target).toBe(
      '[data-testid="desktop-section-navigation"], [data-testid="desktop-section-toggle"]'
    )
    expect(steps.desktop[0]).toMatchObject({ placement: "right" })
    expect(steps.mobile[0]?.target).toBe('[data-testid="section-tabs"]')
  })

  it.each(["desktop", "mobile"] as const)(
    "walks the campaign-event status line before the energy usage bar on %s",
    (viewport) => {
      renderHook(() => useTodayTutorial())
      const steps = register.mock.lastCall?.[0] as Record<
        "desktop" | "mobile",
        { target: string; title: string }[]
      >
      const targets = steps[viewport].map((step) => step.target)

      expect(targets).toContain('[data-testid="campaign-event-status"]')
      expect(
        targets.indexOf('[data-testid="campaign-event-status"]')
      ).toBeLessThan(targets.indexOf('[data-testid="energy-usage"]'))
    }
  )

  it.each(["desktop", "mobile"] as const)(
    "points the raid steps at the dashboard's tiles and cards on %s",
    (viewport) => {
      renderHook(() => useTodayTutorial())
      const steps = register.mock.lastCall?.[0] as Record<
        "desktop" | "mobile",
        { target: string; title: string }[]
      >
      const targetOf = (key: string) =>
        steps[viewport].find(
          (step) => step.title === `localized:tour.today.steps.${key}.title`
        )?.target

      // The plan area always exists: it holds Bonus raids at the energy limit.
      expect(targetOf("schedule")).toBe('[data-testid="today-plan-area"]')
      expect(targetOf("campaignEvent")).toBe(
        '[data-testid="campaign-event-status"]'
      )
      expect(targetOf("energyUsage")).toBe('[data-testid="energy-usage"]')
      expect(targetOf("todaysAttempts")).toBe('[data-testid="todays-attempts"]')
      expect(targetOf("onslaught")).toBe('[data-testid="today-onslaught"]')
    }
  )

  it("walks the quick-filter row right after Raids Filters", () => {
    renderHook(() => useTodayTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string }[]
    }
    const targets = steps.desktop.map((step) => step.target)

    expect(targets.indexOf('[data-testid="today-quick-filters"]')).toBe(
      targets.indexOf('[data-testid="raids-filters"]') + 1
    )
  })

  it("ends with the shop steps folded in from the former Shops tab", () => {
    renderHook(() => useTodayTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string }[]
    }

    expect(steps.desktop.slice(-3).map((step) => step.target)).toEqual([
      '[data-testid="today-shops"]',
      '[data-testid="shop-group-guaranteed"]',
      '[data-testid="shop-group-possible"]',
    ])
    expect(steps.desktop.at(-3)?.title).toBe(
      "localized:shops:tour.shops.steps.purpose.title"
    )
  })

  it("marks only the steps whose card can be left out optional, so the tour drops them then", () => {
    renderHook(() => useTodayTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; data?: { optional?: boolean } }[]
    }

    expect(
      steps.desktop
        .filter((step) => step.data?.optional)
        .map((step) => step.target)
    ).toEqual([
      '[data-testid="today-onslaught"]',
      '[data-testid="shop-group-guaranteed"]',
      '[data-testid="shop-group-possible"]',
    ])
  })
})
