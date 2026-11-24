import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { IconButton } from "./icon-button"
import { TooltipProvider } from "./tooltip"

const touch = { pointerType: "touch", clientX: 10, clientY: 10 }

function visibleTooltip() {
  return document.querySelector('[data-slot="tooltip-content"]')
}

function renderButton(props: Partial<Parameters<typeof IconButton>[0]> = {}) {
  const onClick = vi.fn()
  render(
    <TooltipProvider>
      <IconButton label="Edit team" onClick={onClick} {...props}>
        <svg />
      </IconButton>
    </TooltipProvider>
  )
  return { onClick, button: screen.getByRole("button", { name: "Edit team" }) }
}

describe("IconButton", () => {
  afterEach(() => vi.useRealTimers())

  it("is named by its label and shows it on keyboard focus", () => {
    const { button } = renderButton({ shortcut: "Ctrl+B" })
    fireEvent.focus(button)
    expect(visibleTooltip()).toHaveTextContent("Edit team")
    expect(visibleTooltip()?.querySelector("kbd")).toHaveTextContent("Ctrl+B")
  })

  it("runs its action on a touch tap without opening the tooltip", () => {
    const { onClick, button } = renderButton()
    fireEvent.pointerDown(button, touch)
    fireEvent.pointerUp(button, touch)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(visibleTooltip()).toBeNull()
  })

  it("shows the label on a touch long-press and skips the action", () => {
    vi.useFakeTimers()
    const { onClick, button } = renderButton()
    fireEvent.pointerDown(button, touch)
    act(() => {
      vi.advanceTimersByTime(450)
    })
    fireEvent.pointerUp(button, touch)
    fireEvent.click(button)

    expect(visibleTooltip()).toHaveTextContent("Edit team")
    expect(onClick).not.toHaveBeenCalled()
  })

  it("with a disabled reason, stays focusable, ignores clicks and explains why", () => {
    const { onClick, button } = renderButton({
      disabledReason: "You're offline.",
    })
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(button).not.toBeDisabled()
    expect(button).toHaveAccessibleDescription("You're offline.")

    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()

    fireEvent.focus(button)
    expect(visibleTooltip()).toHaveTextContent("You're offline.")

    // A mouse press keeps the reason open (Radix would close it on pointerdown).
    fireEvent.pointerDown(button, { pointerType: "mouse" })
    expect(visibleTooltip()).toHaveTextContent("You're offline.")
  })

  it("with a disabled reason, shows it on a touch tap", () => {
    const { onClick, button } = renderButton({
      disabledReason: "You're offline.",
    })
    fireEvent.pointerDown(button, touch)
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(visibleTooltip()).toHaveTextContent("You're offline.")
  })
})
