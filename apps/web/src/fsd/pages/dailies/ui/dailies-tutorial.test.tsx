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

  it.each([["Today", useTodayTutorial, "tour.today.steps"]] as const)(
    "registers localized desktop and mobile %s steps",
    (_name, hook, keyPrefix) => {
      renderHook(() => hook())
      const steps = register.mock.lastCall?.[0] as {
        desktop: { target: string; title: string; content: string }[]
        mobile: { target: string; title: string; content: string }[]
      }

      expect(steps.desktop).toEqual(steps.mobile)
      // No project-selector step: the raid pages plan the whole account.
      expect(steps.desktop.length).toBeGreaterThanOrEqual(3)
      expect(
        steps.desktop.some((step) => step.target.includes("project"))
      ).toBe(false)
      for (const step of steps.desktop) {
        expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
        expect(step.title).toContain(`localized:${keyPrefix}`)
        expect(step.content).toContain(`localized:${keyPrefix}`)
      }
    }
  )

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
})
