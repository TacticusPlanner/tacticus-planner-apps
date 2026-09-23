import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Slider } from "./slider"

describe("Slider", () => {
  it("uses a 44px horizontal hit target without enlarging the track or thumb", () => {
    const { container } = render(
      <Slider aria-label="Energy" defaultValue={[5]} />
    )

    expect(container.firstElementChild).toHaveClass("data-horizontal:h-11")
    expect(container.querySelector('[data-slot="slider-track"]')).toHaveClass(
      "data-horizontal:h-1"
    )
    expect(container.querySelector('[data-slot="slider-thumb"]')).toHaveClass(
      "size-4"
    )
  })

  it("honors its range and step for keyboard input", () => {
    const onValueChange = vi.fn()
    render(
      <Slider
        aria-label="Energy"
        defaultValue={[4]}
        min={2}
        max={8}
        step={2}
        onValueChange={onValueChange}
      />
    )

    const thumb = screen.getByRole("slider")
    expect(thumb).toHaveAttribute("aria-valuemin", "2")
    expect(thumb).toHaveAttribute("aria-valuemax", "8")
    expect(thumb).toHaveAttribute("aria-valuenow", "4")

    fireEvent.keyDown(thumb, { key: "ArrowRight" })

    expect(thumb).toHaveAttribute("aria-valuenow", "6")
    expect(onValueChange).toHaveBeenLastCalledWith([6])

    fireEvent.keyDown(thumb, { key: "End" })
    fireEvent.keyDown(thumb, { key: "ArrowRight" })

    expect(thumb).toHaveAttribute("aria-valuenow", "8")
  })

  it("ignores pointer and keyboard input while disabled", () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <Slider
        aria-label="Energy"
        defaultValue={[4]}
        disabled
        min={0}
        max={10}
        step={2}
        onValueChange={onValueChange}
      />
    )

    const root = container.firstElementChild as HTMLElement
    const thumb = screen.getByRole("slider")
    fireEvent.pointerDown(root, {
      button: 0,
      clientX: 100,
      clientY: 20,
      pointerId: 1,
      pointerType: "touch",
    })
    fireEvent.keyDown(thumb, { key: "ArrowRight" })

    expect(thumb).toHaveAttribute("data-disabled")
    expect(thumb).not.toHaveAttribute("tabindex")
    expect(thumb).toHaveAttribute("aria-valuenow", "4")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("uses a 44px vertical hit target and preserves vertical key direction", () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <Slider
        aria-label="Vertical energy"
        defaultValue={[4]}
        min={0}
        max={10}
        orientation="vertical"
        step={2}
        onValueChange={onValueChange}
      />
    )

    expect(container.firstElementChild).toHaveClass("data-vertical:w-11")
    expect(container.querySelector('[data-slot="slider-track"]')).toHaveClass(
      "data-vertical:w-1"
    )

    const thumb = screen.getByRole("slider")
    expect(thumb).toHaveAttribute("aria-orientation", "vertical")
    fireEvent.keyDown(thumb, { key: "ArrowUp" })

    expect(thumb).toHaveAttribute("aria-valuenow", "6")
    expect(onValueChange).toHaveBeenLastCalledWith([6])
  })
})
