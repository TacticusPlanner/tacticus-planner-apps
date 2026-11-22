import { renderHook } from "@testing-library/react"
import type { Step as JoyrideStep } from "react-joyride"
import { describe, expect, it, vi } from "vitest"

import { withoutMissingOptionalSteps } from "@/shared/tour"

import { useInsightsTutorial } from "./insights-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tour")>()),
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

  it("skips the report's cards that are not on the page, never the toolbar", () => {
    renderHook(() => useInsightsTutorial())
    const steps = lastSteps().desktop

    onPage("insights-toolbar", "insights-outlook", "insights-farming")
    expect(shown(steps)).toEqual([
      '[data-testid="insights-toolbar"]',
      '[data-testid="insights-outlook"]',
      '[data-testid="insights-farming"]',
    ])

    // While the plan loads there is no report: only the toolbar step is left.
    onPage("insights-toolbar")
    expect(shown(steps)).toEqual(['[data-testid="insights-toolbar"]'])
  })
})
