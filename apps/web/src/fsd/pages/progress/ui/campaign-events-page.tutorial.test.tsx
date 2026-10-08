import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCampaignEventsTutorial } from "./campaign-events-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

type Steps = {
  desktop: { target: string; title: string; content: string }[]
  mobile: { target: string; title: string; content: string }[]
}
const lastSteps = () => register.mock.lastCall?.[0] as Steps

// Whether each target exists on the rendered page, on desktop and mobile, is asserted in
// campaign-events-page.test.tsx ("tour"); this file covers how the steps are composed.
describe("useCampaignEventsTutorial", () => {
  it("registers identical, localized desktop and mobile steps with an active event", () => {
    renderHook(() =>
      useCampaignEventsTutorial({
        hasCurrentEvent: true,
        firstListEventId: "eventCampaign3",
      })
    )
    const steps = lastSteps()
    expect(steps.desktop).toEqual(steps.mobile)
    for (const step of steps.desktop) {
      expect(step.title).toContain("localized:tour.campaignEvents.steps")
      expect(step.content).toContain("localized:tour.campaignEvents.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="campaign-events-page"]',
      '[data-testid="current-event"]',
      '[data-testid="current-event-track-Standard"]',
      '[data-testid="campaign-event-eventCampaign3-trigger"]',
      '[data-testid="hide-completed-toggle"]',
      '[data-testid="campaign-events-save-hint"]',
    ])
  })

  it("skips the current-event and list steps when their targets cannot exist", () => {
    renderHook(() =>
      useCampaignEventsTutorial({
        hasCurrentEvent: false,
        firstListEventId: undefined,
      })
    )
    expect(lastSteps().desktop.map((step) => step.target)).toEqual([
      '[data-testid="campaign-events-page"]',
      '[data-testid="hide-completed-toggle"]',
      '[data-testid="campaign-events-save-hint"]',
    ])
  })
})
