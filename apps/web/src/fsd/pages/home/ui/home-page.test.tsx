import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HomePage } from "./home-page"

describe("HomePage", () => {
  it("renders the ready state and shared UI button", () => {
    render(<HomePage />)

    expect(
      screen.getByRole("heading", { name: "Project ready!" })
    ).toBeVisible()
    expect(
      screen.getByText("You may now add components and start building.")
    ).toBeVisible()

    const button = screen.getByRole("button", { name: "Button" })

    expect(button).toBeVisible()
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", "default")
    expect(button).toHaveAttribute("data-size", "default")
  })
})
