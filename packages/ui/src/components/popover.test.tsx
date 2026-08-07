import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover"

describe("Popover", () => {
  it("renders its structural wrappers and open content", async () => {
    render(
      <Popover defaultOpen>
        <PopoverAnchor data-testid="popover-anchor" />
        <PopoverTrigger>Open details</PopoverTrigger>
        <PopoverContent className="custom-content">
          <PopoverHeader className="custom-header">
            <PopoverTitle className="custom-title">Details</PopoverTitle>
            <PopoverDescription className="custom-description">
              More information
            </PopoverDescription>
          </PopoverHeader>
          <PopoverArrow className="custom-arrow" />
        </PopoverContent>
      </Popover>
    )

    expect(screen.getByTestId("popover-anchor")).toHaveAttribute(
      "data-slot",
      "popover-anchor"
    )
    expect(
      screen.getByRole("button", { name: "Open details" })
    ).toHaveAttribute("data-slot", "popover-trigger")

    const content = await screen.findByText("More information")
    expect(content.closest('[data-slot="popover-content"]')).toHaveClass(
      "custom-content"
    )
    expect(screen.getByText("Details")).toHaveClass("custom-title")
    expect(content).toHaveClass("custom-description")
    expect(content.parentElement).toHaveClass("custom-header")
    expect(
      content
        .closest('[data-slot="popover-content"]')
        ?.querySelector('[data-slot="popover-arrow"]')
    ).toHaveClass("custom-arrow")
  })
})
