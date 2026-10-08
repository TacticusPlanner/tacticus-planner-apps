import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ObjectiveIcon } from "./objective-icon"

describe("ObjectiveIcon", () => {
  it("renders nothing without an icon", () => {
    const { container } = render(<ObjectiveIcon icon={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders the asset without a badge", () => {
    render(<ObjectiveIcon icon={{ src: "/trait.png" }} />)
    const icon = screen.getByTestId("objective-icon")
    expect(icon).toHaveAttribute("aria-hidden", "true")
    expect(icon.querySelector("img")).toHaveAttribute("src", "/trait.png")
    expect(screen.queryByTestId(/objective-icon-badge/)).toBeNull()
    expect(icon).not.toHaveAttribute("data-muted")
  })

  it("renders the red X, min and max badges", () => {
    const { rerender } = render(
      <ObjectiveIcon icon={{ src: "/trait.png", badge: "not" }} />
    )
    expect(screen.getByTestId("objective-icon-badge-not")).toBeInTheDocument()
    rerender(<ObjectiveIcon icon={{ src: "/hit.png", badge: "min" }} />)
    expect(screen.getByTestId("objective-icon-badge-min")).toHaveTextContent(
      "≥"
    )
    rerender(<ObjectiveIcon icon={{ src: "/hit.png", badge: "max" }} />)
    expect(screen.getByTestId("objective-icon-badge-max")).toHaveTextContent(
      "≤"
    )
  })

  it("mutes a not-satisfied icon", () => {
    render(<ObjectiveIcon icon={{ src: "/trait.png" }} muted />)
    const icon = screen.getByTestId("objective-icon")
    expect(icon).toHaveAttribute("data-muted", "true")
    expect(icon).toHaveClass("opacity-35", "grayscale")
  })
})
