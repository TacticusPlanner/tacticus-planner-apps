import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

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

  it("puts the caption, chips and trailing controls on one row inline, with the note below the row", () => {
    render(
      <TodayQuickFilterChips
        layout="inline"
        onChange={vi.fn()}
        trailing={<button type="button">Planning settings</button>}
        value={["bottlenecks"]}
      />
    )

    const chips = screen.getByTestId("today-quick-filters")
    expect(chips).toHaveTextContent("Quick filters")
    expect(
      screen.getByTestId("today-quick-filter-fewerRaids")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("today-quick-filter-bottlenecks")
    ).toBeInTheDocument()

    const row = chips.parentElement!
    expect(
      within(row).getByRole("button", { name: "Planning settings" })
    ).toBeInTheDocument()
    const note = screen.getByTestId("today-quick-filter-note-bottlenecks")
    expect(row).not.toContainElement(note)
    expect(
      row.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
