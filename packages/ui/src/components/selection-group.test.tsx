import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Pressable } from "./pressable"
import { SelectionGroup, SelectionItem } from "./selection-group"

function Days({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <SelectionGroup
      aria-label="Day"
      onValueChange={onValueChange}
      value={value}
    >
      {["mon", "tue", "wed"].map((day) => (
        <SelectionItem asChild key={day} value={day}>
          <Pressable className="rounded-md border p-1.5">{day}</Pressable>
        </SelectionItem>
      ))}
    </SelectionGroup>
  )
}

describe("SelectionGroup", () => {
  it("makes its items a radio group that keep their own classes", () => {
    render(<Days onValueChange={vi.fn()} value="tue" />)

    expect(screen.getByRole("radiogroup", { name: "Day" })).toBeInTheDocument()
    const tue = screen.getByRole("radio", { name: "tue" })
    expect(tue).toHaveAttribute("aria-checked", "true")
    expect(tue).toHaveAttribute("data-state", "on")
    expect(tue).toHaveClass("interactive-surface", "rounded-md", "border")
    expect(screen.getByRole("radio", { name: "mon" })).toHaveAttribute(
      "aria-checked",
      "false"
    )
  })

  it("reports the picked item, and an empty value when it is pressed again", () => {
    const onValueChange = vi.fn()
    render(<Days onValueChange={onValueChange} value="tue" />)

    fireEvent.click(screen.getByRole("radio", { name: "wed" }))
    expect(onValueChange).toHaveBeenLastCalledWith("wed")

    fireEvent.click(screen.getByRole("radio", { name: "tue" }))
    expect(onValueChange).toHaveBeenLastCalledWith("")
  })

  it("moves between items with the arrow keys", async () => {
    render(<Days onValueChange={vi.fn()} value="tue" />)

    const tue = screen.getByRole("radio", { name: "tue" })
    tue.focus()
    fireEvent.keyDown(tue, { key: "ArrowRight" })
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "wed" })).toHaveFocus()
    )
  })
})
