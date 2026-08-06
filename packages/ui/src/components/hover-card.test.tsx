import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card"

describe("HoverCard", () => {
  it("renders its structural wrappers and open content", async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>Open details</HoverCardTrigger>
        <HoverCardContent className="custom-content">
          More information
        </HoverCardContent>
      </HoverCard>
    )

    expect(screen.getByText("Open details")).toHaveAttribute(
      "data-slot",
      "hover-card-trigger"
    )

    const content = await screen.findByText("More information")
    expect(content).toHaveAttribute("data-slot", "hover-card-content")
    expect(content).toHaveClass("custom-content")
  })
})
