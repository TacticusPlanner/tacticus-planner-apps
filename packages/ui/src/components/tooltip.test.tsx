import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

function renderTooltip() {
  return render(
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe("Tooltip", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("opens on a touch tap, since Radix's hover/focus opening ignores touch pointers", () => {
    renderTooltip()
    const trigger = screen.getByText("Hover me")
    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull()

    fireEvent.pointerDown(trigger, { pointerType: "touch" })
    fireEvent.click(trigger)

    // Radix also renders a visually-hidden a11y copy of the content, so query the visible one
    // specifically rather than by text (which would match both).
    expect(
      document.querySelector('[data-slot="tooltip-content"]')
    ).toBeVisible()
  })

  it("closes a touch-opened tooltip on the next tap elsewhere", () => {
    vi.useFakeTimers()
    renderTooltip()
    const trigger = screen.getByText("Hover me")

    fireEvent.pointerDown(trigger, { pointerType: "touch" })
    fireEvent.click(trigger)
    // Radix also renders a visually-hidden a11y copy of the content, so query the visible one
    // specifically rather than by text (which would match both).
    expect(
      document.querySelector('[data-slot="tooltip-content"]')
    ).toBeVisible()

    // Flush the deferred outside-tap listener (deferred so the opening tap itself doesn't
    // immediately close it too).
    vi.advanceTimersByTime(0)

    fireEvent.pointerDown(document.body, { pointerType: "touch" })

    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull()
  })

  it("does not toggle on a mouse click, leaving Radix's native hover behavior untouched", () => {
    renderTooltip()
    const trigger = screen.getByText("Hover me")

    fireEvent.pointerDown(trigger, { pointerType: "mouse" })
    fireEvent.click(trigger)

    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull()
  })

  it("stays open through the focus event a real touch tap also fires, instead of flashing closed", () => {
    // On real devices tapping a button fires pointerdown → pointerup → focus → click. Radix's own
    // trigger opens the tooltip on that focus event (it can't tell a tap's focus from a keyboard
    // one) — the click ending the same tap must not then toggle that back closed.
    renderTooltip()
    const trigger = screen.getByText("Hover me")

    fireEvent.pointerDown(trigger, { pointerType: "touch" })
    fireEvent.focus(trigger)
    fireEvent.click(trigger)

    expect(
      document.querySelector('[data-slot="tooltip-content"]')
    ).toBeVisible()
  })

  it("closes on a second tap of the same trigger", () => {
    renderTooltip()
    const trigger = screen.getByText("Hover me")

    fireEvent.pointerDown(trigger, { pointerType: "touch" })
    fireEvent.focus(trigger)
    fireEvent.click(trigger)
    expect(
      document.querySelector('[data-slot="tooltip-content"]')
    ).toBeVisible()

    // The trigger stays focused across taps (focus doesn't fire again), matching real devices.
    fireEvent.pointerDown(trigger, { pointerType: "touch" })
    fireEvent.click(trigger)

    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull()
  })
})
