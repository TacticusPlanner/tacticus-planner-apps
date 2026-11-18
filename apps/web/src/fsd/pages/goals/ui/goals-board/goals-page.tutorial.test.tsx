import { renderHook } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

import { useGoalsOverviewTutorial } from "./goals-page.tutorial"

const register = vi.fn()

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useGoalsOverviewTutorial", () => {
  it("registers localized desktop and mobile steps, with the View controls behind one step on mobile", () => {
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
      '[data-testid="goals-view-toggle"]',
      '[data-testid="goal-row-drag-handle"]',
      '[data-testid="goals-select-toggle"]',
      '[data-testid="goals-create-goal"]',
      '[data-testid="goals-planning-settings"]',
      '[data-testid="goals-page"]',
    ])
    // Mobile points at the toolbar's View button instead of Season fit and Layout (they sit in its
    // sheet), swaps the reprioritize target for the Reorder toggle, and has no Create
    // goal step (the bottom nav's Add Goal is the page action there).
    expect(steps.mobile.map((step) => step.target)).toEqual([
      '[data-testid="goals-project-scope"]',
      '[data-testid="goals-status-filter"]',
      '[data-testid="goals-type-filter"]',
      '[data-testid="goals-view-options"]',
      '[data-testid="goals-mobile-reorder-toggle"]',
      '[data-testid="goals-select-toggle"]',
      '[data-testid="goals-planning-settings"]',
      '[data-testid="goals-page"]',
    ])
    expect(
      steps.desktop.map((step) => `${step.title} ${step.content}`).join(" ")
    ).toContain("account-wide priority order")
    expect(steps.desktop[3]).toMatchObject({
      title: "Season fit",
      content: expect.stringContaining("which goals finish in time"),
    })
    expect(steps.desktop[4]).toMatchObject({
      title: "Layout, Group by and Sort",
      content: expect.stringContaining("saved on this device"),
    })
    expect(steps.mobile[3]).toMatchObject({
      title: "View",
      content: expect.stringContaining("Season fit"),
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
