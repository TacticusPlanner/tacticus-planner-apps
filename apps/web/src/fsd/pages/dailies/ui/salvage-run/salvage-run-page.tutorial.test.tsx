import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useSalvageRunTutorial } from "./salvage-run-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useSalvageRunTutorial", () => {
  it("registers identical, localized desktop and mobile steps targeting the page's testids", () => {
    renderHook(() => useSalvageRunTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop).toHaveLength(9)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.salvageRun.steps")
      expect(step.content).toContain("localized:tour.salvageRun.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="salvage-run-page"]',
      '[data-testid="salvage-track-selector"]',
      '[data-testid="salvage-mode-toggle"]',
      '[data-testid="salvage-project-select"]',
      '[data-testid="salvage-team-size"]',
      '[data-testid="salvage-preferences"]',
      '[data-testid="salvage-category-plan"]',
      '[data-testid="salvage-category-random"]',
      '[data-testid="salvage-random-regenerate"]',
    ])
  })
})
