import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"

describe("Button", () => {
  it("renders a button with stable data attributes", () => {
    render(
      <Button variant="secondary" size="sm">
        Save
      </Button>
    )

    const button = screen.getByRole("button", { name: "Save" })

    expect(button).toBeVisible()
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", "secondary")
    expect(button).toHaveAttribute("data-size", "sm")
  })

  it("renders as a child element when asChild is enabled", () => {
    render(
      <Button asChild variant="link" size="lg">
        <a href="/docs">Docs</a>
      </Button>
    )

    const link = screen.getByRole("link", { name: "Docs" })

    expect(link).toBeVisible()
    expect(link).toHaveAttribute("href", "/docs")
    expect(link).toHaveAttribute("data-slot", "button")
    expect(link).toHaveAttribute("data-variant", "link")
    expect(link).toHaveAttribute("data-size", "lg")
  })
})
