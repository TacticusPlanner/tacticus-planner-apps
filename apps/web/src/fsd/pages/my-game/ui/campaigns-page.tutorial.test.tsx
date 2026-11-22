import { renderHook } from "@testing-library/react"
import type { Step as JoyrideStep } from "react-joyride"
import { describe, expect, it, vi } from "vitest"

import { withoutMissingOptionalSteps } from "@/shared/tour"

import { useCampaignsTutorial } from "./campaigns-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tour")>()),
  useTourPageSteps: (steps: unknown) => register(steps),
}))

type Step = { target: string; title: string; content: string }
type Steps = { desktop: Step[]; mobile: Step[] }
const lastSteps = () => register.mock.lastCall?.[0] as Steps
const targets = (steps: Step[]) => steps.map((step) => step.target)

/** Leaves only these test ids on the page, for the tour's missing-target filter. */
function onPage(...testIds: string[]) {
  document.body.replaceChildren(
    ...testIds.map((testId) => {
      const element = document.createElement("div")
      element.dataset.testid = testId
      return element
    })
  )
}
const shown = (steps: Step[]) =>
  targets(withoutMissingOptionalSteps(steps as JoyrideStep[]) as Step[])

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

  it("drops both steps while the progress loads or fails, and keeps both once it renders", () => {
    renderHook(() => useCampaignsTutorial())
    const steps = lastSteps().desktop

    onPage()
    expect(shown(steps)).toEqual([])

    onPage("campaigns-summary", "campaigns-stories")
    expect(shown(steps)).toEqual(targets(steps))
  })
})
