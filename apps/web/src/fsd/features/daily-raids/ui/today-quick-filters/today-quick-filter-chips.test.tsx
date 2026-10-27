import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import { TodayQuickFilterChips } from "./today-quick-filter-chips"

describe("TodayQuickFilterChips", () => {
  it("starts a second toggle from the first while the URL value has not committed yet", async () => {
    const onChange = vi.fn()
    // `value` never updates, like Today while its URL navigation is still pending.
    render(<TodayQuickFilterChips value={[]} onChange={onChange} />)

    await userEvent.click(screen.getByTestId("today-quick-filter-fewerRaids"))
    await userEvent.click(screen.getByTestId("today-quick-filter-bottlenecks"))

    expect(onChange).toHaveBeenLastCalledWith(["fewerRaids", "bottlenecks"])
    expect(
      screen.getByTestId("today-quick-filter-note-bottlenecks")
    ).toBeInTheDocument()
  })

  it("follows a new committed value", () => {
    const { rerender } = render(
      <TodayQuickFilterChips value={["fewerRaids"]} onChange={vi.fn()} />
    )
    rerender(<TodayQuickFilterChips value={[]} onChange={vi.fn()} />)

    expect(screen.getByTestId("today-quick-filter-fewerRaids")).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })
})
