import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { render, screen } from "@/test/render"

import { GoalsViewToggle } from "./goals-view-toggle"

describe("GoalsViewToggle", () => {
  it("names the group and each option, and marks the current view pressed", () => {
    render(<GoalsViewToggle onViewChange={vi.fn()} view="Cards" />)

    expect(screen.getByTestId("goals-view-toggle")).toHaveAttribute(
      "aria-label",
      "Goals view"
    )
    expect(screen.getByRole("radio", { name: "Cards" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Table" })).not.toBeChecked()
    expect(screen.getByTestId("goals-view-cards")).toHaveAttribute(
      "data-state",
      "on"
    )
  })

  it("reports a switch, and ignores a click on the already-pressed option", async () => {
    const onViewChange = vi.fn()
    const user = userEvent.setup()
    render(<GoalsViewToggle onViewChange={onViewChange} view="Cards" />)

    await user.click(screen.getByRole("radio", { name: "Cards" }))
    expect(onViewChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole("radio", { name: "Table" }))
    expect(onViewChange).toHaveBeenCalledWith("Table")
  })

  it("stays rendered but disabled while the stored view loads", () => {
    render(<GoalsViewToggle disabled onViewChange={vi.fn()} view="Cards" />)

    expect(screen.getByRole("radio", { name: "Table" })).toBeDisabled()
  })
})
