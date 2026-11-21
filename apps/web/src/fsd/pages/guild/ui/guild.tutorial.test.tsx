import { renderHook } from "@testing-library/react"
import type { Step as JoyrideStep } from "react-joyride"
import { describe, expect, it, vi } from "vitest"

import { withoutMissingOptionalSteps } from "@/shared/tour"

import { useGuildTutorial } from "./guild.tutorial"

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

describe("useGuildTutorial", () => {
  it("covers the summary, the actions and the member table or cards on Members", () => {
    renderHook(() => useGuildTutorial("members"))
    const steps = lastSteps()
    expect(targets(steps.desktop)).toEqual([
      '[data-testid="guild-summary"]',
      '[data-testid="guild-toolbar"]',
      '[data-testid="guild-members-table"]',
    ])
    expect(targets(steps.mobile).at(-1)).toBe(
      '[data-testid="guild-members-cards"]'
    )
    expect(optional(steps.desktop)).toEqual([
      '[data-testid="guild-toolbar"]',
      '[data-testid="guild-members-table"]',
    ])
  })

  it("covers the Guild API key card on Settings", () => {
    renderHook(() => useGuildTutorial("settings"))
    const steps = lastSteps()
    expect(targets(steps.desktop)).toEqual([
      '[data-testid="guild-summary"]',
      '[data-testid="guild-toolbar"]',
      '[data-testid="guild-settings"]',
    ])
    expect(steps.desktop.at(-1)?.title).toBe(
      "localized:tour.guild.steps.apiKey.title"
    )
    expect(steps.mobile).toEqual(steps.desktop)
  })

  it("skips the actions for a member and the member list for an empty guild, keeping the summary", () => {
    renderHook(() => useGuildTutorial("members"))
    const steps = lastSteps()

    // A plain member: no Sync / Delete actions, members listed.
    onPage("guild-summary", "guild-members-table", "guild-members-cards")
    expect(shown(steps.desktop)).toEqual([
      '[data-testid="guild-summary"]',
      '[data-testid="guild-members-table"]',
    ])
    expect(shown(steps.mobile)).toEqual([
      '[data-testid="guild-summary"]',
      '[data-testid="guild-members-cards"]',
    ])

    // An empty guild seen by a member: only the summary is left.
    onPage("guild-summary")
    expect(shown(steps.desktop)).toEqual(['[data-testid="guild-summary"]'])
    expect(shown(steps.mobile)).toEqual(['[data-testid="guild-summary"]'])
  })
})
