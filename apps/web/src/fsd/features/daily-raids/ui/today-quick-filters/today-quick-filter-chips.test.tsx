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
    await userEvent.click(screen.getByTestId("today-quick-filter-combineGoals"))

    expect(onChange).toHaveBeenLastCalledWith(["fewerRaids", "combineGoals"])
    expect(
      screen.getByTestId("today-quick-filter-note-combineGoals")
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

  it("puts a page's own chips on the chips' line, with the notes below", () => {
    render(
      <TodayQuickFilterChips
        extra={<button type="button">Ignore goals</button>}
        onChange={vi.fn()}
        value={["combineGoals"]}
      />
    )

    const row = screen.getByRole("toolbar", {
      name: "Plan options",
    }).parentElement!
    expect(
      within(row).getByRole("button", { name: "Ignore goals" })
    ).toBeInTheDocument()
    const note = screen.getByTestId("today-quick-filter-note-combineGoals")
    expect(row).not.toContainElement(note)
  })
})
