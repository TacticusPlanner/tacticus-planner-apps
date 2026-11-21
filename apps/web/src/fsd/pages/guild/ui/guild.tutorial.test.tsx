import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useGuildTutorial } from "./guild.tutorial"

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
})
