import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useIncursionsOverviewTutorial } from "./incursions-overview.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

type Step = {
  target: string
  title: string
  content: string
  data?: { optional?: boolean }
}
type Steps = { desktop: Step[]; mobile: Step[] }
const lastSteps = () => register.mock.lastCall?.[0] as Steps
const targets = (steps: Step[]) => steps.map((step) => step.target)
const optional = (steps: Step[]) =>
  steps.filter((step) => step.data?.optional).map((step) => step.target)

describe("useIncursionsOverviewTutorial", () => {
  it("covers the rules and the MoW cards, both optional", () => {
    renderHook(() => useIncursionsOverviewTutorial())
    const steps = lastSteps()
    expect(targets(steps.desktop)).toEqual([
      '[data-testid="incursions-rules"]',
      '[data-testid="incursions-list"]',
    ])
    expect(optional(steps.desktop)).toEqual(targets(steps.desktop))
    expect(steps.desktop[1]?.content).toBe(
      "localized:tour.incursions.steps.list.content"
    )
    expect(steps.mobile).toEqual(steps.desktop)
  })
})
