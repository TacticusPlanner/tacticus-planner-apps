import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useArenaTutorial } from "./arena-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useArenaTutorial", () => {
  it("registers identical, localized desktop and mobile steps targeting the page's testids", () => {
    renderHook(() => useArenaTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop).toHaveLength(8)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.arena.steps")
      expect(step.content).toContain("localized:tour.arena.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="arena-page"]',
      '[data-testid="arena-mode-toggle"]',
      '[data-testid="arena-project-select"]',
      '[data-testid="arena-team-size"]',
      '[data-testid="arena-preferences"]',
      '[data-testid="arena-category-plan"]',
      '[data-testid="arena-category-random"]',
      '[data-testid="arena-random-regenerate"]',
    ])
  })
})
