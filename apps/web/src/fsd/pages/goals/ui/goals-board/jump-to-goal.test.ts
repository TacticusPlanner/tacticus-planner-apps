// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import { jumpToGoalRow } from "./jump-to-goal"

afterEach(() => {
  document.body.innerHTML = ""
})

function mountRow(goalId: string) {
  const row = document.createElement("li")
  row.dataset.testid = "goal-row"
  row.dataset.goalId = goalId
  row.tabIndex = -1
  row.scrollIntoView = vi.fn()
  document.body.append(row)
  return row
}

describe("jumpToGoalRow", () => {
  it("scrolls the goal's row to the centre and focuses it", () => {
    const row = mountRow("goal-3")

    expect(jumpToGoalRow("goal-3")).toBe(true)
    expect(row.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    })
    expect(document.activeElement).toBe(row)
  })

  it("scrolls instantly under reduced motion", () => {
    const row = mountRow("goal-3")
    vi.stubGlobal("matchMedia", () => ({ matches: true }))

    jumpToGoalRow("goal-3")
    expect(row.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
    })
    vi.unstubAllGlobals()
  })

  it("reports a goal that isn't on screen", () => {
    mountRow("goal-1")
    expect(jumpToGoalRow("goal-3")).toBe(false)
  })
})
