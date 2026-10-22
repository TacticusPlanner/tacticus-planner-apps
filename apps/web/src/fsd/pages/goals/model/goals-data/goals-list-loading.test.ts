import { describe, expect, it } from "vitest"

import { isGoalsListLoading } from "./goals-list-loading"

const settled = {
  goalsLoading: false,
  tab: "toReach" as const,
  requestedProjectId: undefined,
  projectsLoading: false,
  attainmentPending: false,
  hasCandidateGoals: true,
}

describe("isGoalsListLoading", () => {
  it("is settled once goals, scope and attainment are known", () => {
    expect(isGoalsListLoading(settled)).toBe(false)
  })

  it("waits for the goal list", () => {
    expect(isGoalsListLoading({ ...settled, goalsLoading: true })).toBe(true)
  })

  it("waits for the project list behind a requested scope, but not without one", () => {
    expect(
      isGoalsListLoading({
        ...settled,
        requestedProjectId: "p",
        projectsLoading: true,
      })
    ).toBe(true)
    expect(isGoalsListLoading({ ...settled, projectsLoading: true })).toBe(
      false
    )
  })

  it.each([
    ["toReach", true],
    ["reached", true],
    ["active", false],
    ["paused", false],
    ["blocked", false],
  ] as const)("on %s waits for attainment: %s", (tab, expected) => {
    expect(
      isGoalsListLoading({ ...settled, tab, attainmentPending: true })
    ).toBe(expected)
  })

  it("does not wait for attainment when no goal could be shown", () => {
    expect(
      isGoalsListLoading({
        ...settled,
        attainmentPending: true,
        hasCandidateGoals: false,
      })
    ).toBe(false)
  })
})
