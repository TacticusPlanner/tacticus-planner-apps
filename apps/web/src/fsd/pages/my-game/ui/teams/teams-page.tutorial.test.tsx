import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useTeamsTutorial } from "./teams-page.tutorial"

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
const targets = () => lastSteps().desktop.map((step) => step.target)

// Whether each target exists on the rendered page is covered by teams-page.test.tsx's test ids;
// this file covers how the steps are composed.
describe("useTeamsTutorial", () => {
  it("covers the Mode select, grouping and layout, Create team, a card and reordering on a populated list", () => {
    renderHook(() =>
      useTeamsTutorial({
        hasTeam: true,
        canReorder: true,
        teamTarget: "team-card",
      })
    )
    const steps = lastSteps()
    expect(steps.desktop).toEqual(steps.mobile)
    expect(targets()).toEqual([
      '[data-testid="teams-mode-select"]',
      '[data-testid="teams-view"]',
      '[data-testid="teams-create"]',
      '[data-testid="team-card"]',
      '[data-testid="team-card-drag"]',
    ])
    for (const step of steps.desktop) {
      expect(step.title).toContain("localized:tour.teams.steps.")
      expect(step.content).toContain("localized:tour.teams.steps.")
    }
  })

  it("skips the steps that need a card on an empty list", () => {
    renderHook(() =>
      useTeamsTutorial({
        hasTeam: false,
        canReorder: false,
        teamTarget: "team-card",
      })
    )
    expect(targets()).toEqual([
      '[data-testid="teams-mode-select"]',
      '[data-testid="teams-view"]',
      '[data-testid="teams-create"]',
    ])
  })

  it("skips reordering with only one team listed", () => {
    renderHook(() =>
      useTeamsTutorial({
        hasTeam: true,
        canReorder: false,
        teamTarget: "team-card",
      })
    )
    expect(targets()).not.toContain('[data-testid="team-card-drag"]')
  })
})
