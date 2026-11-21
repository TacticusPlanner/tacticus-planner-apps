import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useInsightsTutorial } from "./insights-page.tutorial"

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

describe("useInsightsTutorial", () => {
  it("covers the toolbar, then the report's cards as optional steps", () => {
    renderHook(() => useInsightsTutorial())
    const steps = lastSteps()
    expect(targets(steps.desktop)).toEqual([
      '[data-testid="insights-toolbar"]',
      '[data-testid="insights-outlook"]',
      '[data-testid="insights-holding-back"]',
      '[data-testid="insights-farming"]',
      '[data-testid="insights-missing"]',
    ])
    expect(optional(steps.desktop)).toEqual(targets(steps.desktop).slice(1))
    expect(steps.mobile).toEqual(steps.desktop)
  })
})
