import { describe, expect, it, vi } from "vitest"

import { renderHook } from "@/test/render"

import { useScheduleTutorial } from "./schedule-page.tutorial"

const register = vi.fn()

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("Schedule tutorial", () => {
  it("registers localized desktop and mobile steps over the summary and the days", () => {
    renderHook(() => useScheduleTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="plan-summary"]',
      '[data-testid="plan-unit-filter"]',
      '[data-testid="plan-days"]',
    ])
    // The English copy from dailies.json, not translation keys.
    expect(steps.desktop.map((step) => step.title)).toEqual([
      "Whole-plan summary",
      "Unit filter",
      "Raid days",
    ])
    expect(steps.desktop[0]?.content).toMatch(
      /^These totals cover every planned day/
    )
    expect(steps.desktop[1]?.content).toMatch(/^Pick a unit to dim everything/)
    expect(steps.desktop[2]?.content).toMatch(
      /^Each day card lists the upgrades/
    )
    for (const step of steps.desktop) {
      expect(step.title).not.toContain("tour.raidsPlan.steps")
      expect(step.content).not.toContain("tour.raidsPlan.steps")
    }
  })
})
