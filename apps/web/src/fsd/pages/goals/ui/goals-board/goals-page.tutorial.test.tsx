import { renderHook } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

import { useGoalsOverviewTutorial } from "./goals-page.tutorial"

const register = vi.fn()

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useGoalsOverviewTutorial", () => {
  it("registers localized desktop and mobile steps, differing only in the reprioritize, select and bulk-actions targets", () => {
    renderHook(() => useGoalsOverviewTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop.length).toBeGreaterThanOrEqual(3)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      // Real English copy, never a raw key.
      expect(step.title).not.toMatch(/^$|tour\.overview\.steps/)
      expect(step.content).not.toMatch(/^$|tour\.overview\.steps/)
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="goals-project-scope"]',
      '[data-testid="goals-status-filter"]',
      '[data-testid="goals-type-filter"]',
      '[data-testid="goals-season-fit"]',
      '[data-testid="goal-row-drag-handle"]',
      '[data-testid="goals-select-all"]',
      '[data-testid="goals-bulk-actions"]',
      '[data-testid="goals-order-hint"]',
      '[data-testid="goals-create-goal"]',
      '[data-testid="goals-planning-settings"]',
      '[data-testid="goals-page"]',
    ])
    // Mobile swaps the reprioritize and select targets for the control-row toggles and has no
    // bulk-actions step (the bar only exists inside select mode).
    expect(steps.mobile.map((step) => step.target)).toEqual(
      steps.desktop
        .filter((step) => step.target !== '[data-testid="goals-bulk-actions"]')
        .map((step) =>
          step.target === '[data-testid="goal-row-drag-handle"]'
            ? '[data-testid="goals-mobile-reorder-toggle"]'
            : step.target === '[data-testid="goals-select-all"]'
              ? '[data-testid="goals-mobile-select-toggle"]'
              : step.target
        )
    )
    expect(
      steps.desktop.map((step) => `${step.title} ${step.content}`).join(" ")
    ).toContain("How the order works")
    expect(steps.desktop[3]).toMatchObject({
      title: "Season fit",
      content: expect.stringContaining("which goals finish in time"),
    })
    for (const list of [steps.desktop, steps.mobile]) {
      expect(list[0]).toMatchObject({
        title: "Scope by project",
        content: expect.stringContaining(
          "Pick a project to see only its goals"
        ),
      })
    }
    expect(
      steps.mobile.map((step) => `${step.title} ${step.content}`).join(" ")
    ).toContain("Prioritize your goals")
  })
})
