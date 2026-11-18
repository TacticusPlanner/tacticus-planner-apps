import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useGuildRaidsTutorial } from "./guild-raids.tutorial"

type Step = { target: string; title: string; content: string }
type Steps = { desktop: Step[]; mobile: Step[] }

const { register } = vi.hoisted(() => ({ register: vi.fn() }))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

const lastSteps = () => register.mock.lastCall?.[0] as Steps
const isScoring = (step: Step) =>
  step.title === "localized:guildRaids.exactMeta.howScored"

beforeEach(() => register.mockClear())

describe("useGuildRaidsTutorial", () => {
  it.each(["desktop", "mobile"] as const)(
    "explains how readiness is scored after the Meta readiness step on %s",
    (layout) => {
      renderHook(() => useGuildRaidsTutorial(true))
      const steps = lastSteps()[layout]
      const scoring = steps.find(isScoring)

      expect(scoring?.target).toBe(
        '[data-testid="guild-raid-exact-meta-section"]'
      )
      expect(scoring?.content).toContain(
        "localized:guildRaids.exactMeta.howScoredPicks"
      )
      expect(scoring?.content).toContain(
        "localized:guildRaids.exactMeta.howScoredReadiness"
      )
      expect(steps.at(-1)).toBe(scoring)
    }
  )

  it("leaves out the Meta readiness and scoring steps without an active boss", () => {
    renderHook(() => useGuildRaidsTutorial(false))
    const { desktop, mobile } = lastSteps()

    for (const steps of [desktop, mobile]) {
      expect(steps.some(isScoring)).toBe(false)
      expect(steps.map((step) => step.target)).not.toContain(
        '[data-testid="guild-raid-exact-meta-section"]'
      )
    }
  })
})
