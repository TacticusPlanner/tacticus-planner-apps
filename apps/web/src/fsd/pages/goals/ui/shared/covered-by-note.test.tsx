import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CoveredByNote } from "./covered-by-note"

const covering = (globalPriority: number | null) =>
  ({
    goalId: "goal-3",
    goalType: "Rank",
    globalPriority,
    config: {},
  }) as never

describe("CoveredByNote", () => {
  it("names the covering goal's priority and jumps to it", async () => {
    const onJump = vi.fn()
    render(<CoveredByNote coveredBy={covering(3)} onJump={onJump} />)

    const link = screen.getByRole("button", { name: /^Covered by #3 · Rank/ })
    await userEvent.click(link)
    expect(onJump).toHaveBeenCalledWith("goal-3")
  })

  it("falls back to the goal's wording when it has no position", () => {
    render(<CoveredByNote coveredBy={covering(null)} onJump={vi.fn()} />)
    expect(screen.getByTestId("goal-covered-by")).toHaveTextContent(
      /^Covered by the Rank →.*goal$/
    )
  })

  it("is plain text without a jump handler", () => {
    render(<CoveredByNote coveredBy={covering(3)} />)
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.getByTestId("goal-covered-by")).toHaveTextContent(
      /^Covered by #3 · Rank/
    )
  })
})
