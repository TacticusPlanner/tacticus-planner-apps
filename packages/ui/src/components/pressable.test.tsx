import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Pressable } from "./pressable"

describe("Pressable", () => {
  it("renders a plain button with the surface hover by default", () => {
    const onClick = vi.fn()
    render(
      <Pressable className="p-3" onClick={onClick}>
        Open goal
      </Pressable>
    )

    const button = screen.getByRole("button", { name: "Open goal" })
    expect(button).toHaveAttribute("type", "button")
    expect(button).toHaveAttribute("data-variant", "surface")
    expect(button).toHaveClass("interactive-surface", "p-3")

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("uses the art hover instead of a fill for portraits", () => {
    render(<Pressable variant="art" aria-label="Ragnar" />)

    const button = screen.getByRole("button", { name: "Ragnar" })
    expect(button).toHaveAttribute("data-variant", "art")
    expect(button).not.toHaveClass("interactive-surface")
    expect(button).toHaveClass("hover:brightness-110")
  })

  it("does not fire when disabled", () => {
    const onClick = vi.fn()
    render(
      <Pressable disabled onClick={onClick}>
        Open goal
      </Pressable>
    )

    const button = screen.getByRole("button", { name: "Open goal" })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("lets an explicit type override the default", () => {
    render(<Pressable type="submit">Save</Pressable>)

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "submit"
    )
  })
})
