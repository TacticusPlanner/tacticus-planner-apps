import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useGlobalPlanTutorial } from "./global-plan-page.tutorial"

const register = vi.hoisted(() => vi.fn())

vi.mock("@/shared/tour", () => ({ useTourPageSteps: register }))
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))

describe("useGlobalPlanTutorial", () => {
  beforeEach(() => register.mockClear())

  it("registers localized steps that explain the one plan, reprioritizing and new goals", () => {
    renderHook(() => useGlobalPlanTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    for (const viewport of [steps.desktop, steps.mobile]) {
      expect(viewport).toHaveLength(3)
      expect(viewport[0]!.content).toBe(
        "localized:tour.globalPlan.steps.intro.content"
      )
      expect(viewport[2]!.target).toBe(
        '[data-testid="global-plan-create-goal"]'
      )
    }
  })

  it("targets a drag handle on desktop and the reorder toggle on mobile", () => {
    renderHook(() => useGlobalPlanTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string }[]
      mobile: { target: string }[]
    }

    expect(steps.desktop[1]!.target).toBe(
      '[data-testid="goal-row-drag-handle"]'
    )
    expect(steps.mobile[1]!.target).toBe(
      '[data-testid="global-plan-mobile-reorder-toggle"]'
    )
  })
})
