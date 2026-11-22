import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DetailsOverlay, DetailsSheet } from "./details-sheet"

const mobile = vi.hoisted(() => ({ value: false }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

function renderOverlay() {
  return render(
    <DetailsOverlay
      description="Only one is offered"
      testId="details"
      title="2 possible rewards"
      trigger={<button type="button">Open</button>}
    >
      <p>Body</p>
    </DetailsOverlay>
  )
}

describe("DetailsOverlay", () => {
  beforeEach(() => {
    mobile.value = false
  })

  it("opens a popover named by its title on desktop", () => {
    renderOverlay()

    fireEvent.click(screen.getByRole("button", { name: "Open" }))

    const panel = screen.getByTestId("details")
    expect(panel).toHaveAttribute("data-slot", "popover-content")
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "2 possible rewards"
    )
    expect(panel).toHaveTextContent("Only one is offered")
    expect(panel).toHaveTextContent("Body")
  })

  it("opens a details sheet on a phone", () => {
    mobile.value = true
    renderOverlay()

    fireEvent.click(screen.getByRole("button", { name: "Open" }))

    const panel = screen.getByTestId("details")
    expect(panel).toHaveAttribute("data-slot", "drawer-content")
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "2 possible rewards"
    )
    expect(panel).toHaveTextContent("Body")
  })
})

describe("DetailsSheet", () => {
  it("opens from state and keeps a hidden description for screen readers", () => {
    render(
      <DetailsSheet
        description="Enemy details"
        descriptionHidden
        open
        testId="sheet"
        title="Kroot Carnivore"
      >
        <p>Stats</p>
      </DetailsSheet>
    )

    expect(screen.getByTestId("sheet")).toHaveTextContent("Stats")
    expect(screen.getByText("Enemy details")).toHaveClass("sr-only")
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "Enemy details"
    )
  })
})
