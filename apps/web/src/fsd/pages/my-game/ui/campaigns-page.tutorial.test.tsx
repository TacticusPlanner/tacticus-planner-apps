import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCampaignsTutorial } from "./campaigns-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

type Step = { target: string; title: string; content: string }
type Steps = { desktop: Step[]; mobile: Step[] }
const lastSteps = () => register.mock.lastCall?.[0] as Steps
const targets = (steps: Step[]) => steps.map((step) => step.target)

describe("useCampaignsTutorial", () => {
  it("covers the totals and the story cards, the same on both forms", () => {
    renderHook(() => useCampaignsTutorial())
    const steps = lastSteps()
    expect(targets(steps.desktop)).toEqual([
      '[data-testid="campaigns-summary"]',
      '[data-testid="campaigns-stories"]',
    ])
    expect(steps.desktop[0]?.title).toBe(
      "localized:tour.campaigns.steps.summary.title"
    )
    expect(steps.mobile).toEqual(steps.desktop)
  })
})
