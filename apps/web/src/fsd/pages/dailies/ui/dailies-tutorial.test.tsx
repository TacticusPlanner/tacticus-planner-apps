import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useRaidsPlanTutorial } from "./raids-plan.tutorial"
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
    ["Today", useTodayTutorial, "tour.today.steps"],
    ["Raids Plan", useRaidsPlanTutorial, "tour.raidsPlan.steps"],
  ] as const)(
    "registers localized desktop and mobile %s steps",
    (_name, hook, keyPrefix) => {
      renderHook(() => hook())
      const steps = register.mock.lastCall?.[0] as {
        desktop: { target: string; title: string; content: string }[]
        mobile: { target: string; title: string; content: string }[]
      }

      expect(steps.desktop).toEqual(steps.mobile)
      expect(steps.desktop.length).toBeGreaterThanOrEqual(4)
      for (const step of steps.desktop) {
        expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
        expect(step.title).toContain(`localized:${keyPrefix}`)
        expect(step.content).toContain(`localized:${keyPrefix}`)
      }
    }
  )

  it("uses distinct copy for the Dailies and Raids tab steps", () => {
    renderHook(() => useTodayTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop.slice(0, 2).map((step) => step.title)).toEqual([
      "localized:tour.today.steps.navigation.title",
      "localized:tour.today.steps.raids.title",
    ])
  })
})
