import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useOnslaughtTutorial } from "./onslaught-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useOnslaughtTutorial", () => {
  it("registers identical, localized desktop and mobile steps targeting the page's testids", () => {
    renderHook(() => useOnslaughtTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop).toHaveLength(10)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.onslaught.steps")
      expect(step.content).toContain("localized:tour.onslaught.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="onslaught-page"]',
      '[data-testid="onslaught-track-selector"]',
      '[data-testid="onslaught-mode-toggle"]',
      '[data-testid="onslaught-project-select"]',
      '[data-testid="onslaught-team-size"]',
      '[data-testid="onslaught-preferences"]',
      '[data-testid="onslaught-category-plan"]',
      '[data-testid="onslaught-shard-recipient"]',
      '[data-testid="onslaught-category-random"]',
      '[data-testid="onslaught-random-regenerate"]',
    ])
  })
})
