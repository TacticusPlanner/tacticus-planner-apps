import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useLongPress } from "./use-long-press"

function Pressable({
  onLongPress,
  onClick,
}: {
  onLongPress: () => void
  onClick: () => void
}) {
  const handlers = useLongPress({ onLongPress })
  return (
    <button onClick={onClick} type="button">
      <span {...handlers}>Unit</span>
    </button>
  )
}

function setup() {
  const onLongPress = vi.fn()
  const onClick = vi.fn()
  render(<Pressable onClick={onClick} onLongPress={onLongPress} />)
  return { onLongPress, onClick, target: screen.getByText("Unit") }
}

const touch = { pointerType: "touch", clientX: 10, clientY: 10 }

describe("useLongPress", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("fires after the delay and swallows the click that ends the press", () => {
    const { onLongPress, onClick, target } = setup()
    fireEvent.pointerDown(target, touch)
    vi.advanceTimersByTime(450)
    expect(onLongPress).toHaveBeenCalledTimes(1)

    fireEvent.pointerUp(target, touch)
    fireEvent.click(target)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("does not swallow a later click once the press is over", () => {
    const { onClick, target } = setup()
    fireEvent.pointerDown(target, touch)
    vi.advanceTimersByTime(450)
    fireEvent.pointerUp(target, touch)
    vi.advanceTimersByTime(500)
    fireEvent.click(target)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not fire on a release before the delay, and the tap still clicks", () => {
    const { onLongPress, onClick, target } = setup()
    fireEvent.pointerDown(target, touch)
    vi.advanceTimersByTime(300)
    fireEvent.pointerUp(target, touch)
    fireEvent.click(target)
    vi.advanceTimersByTime(500)

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("drops the press when the finger moves past the tolerance (a scroll)", () => {
    const { onLongPress, target } = setup()
    fireEvent.pointerDown(target, touch)
    fireEvent.pointerMove(target, { ...touch, clientY: 30 })
    vi.advanceTimersByTime(600)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it("keeps the press within the tolerance", () => {
    const { onLongPress, target } = setup()
    fireEvent.pointerDown(target, touch)
    fireEvent.pointerMove(target, { ...touch, clientX: 15 })
    vi.advanceTimersByTime(450)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("ignores a mouse press", () => {
    const { onLongPress, onClick, target } = setup()
    fireEvent.pointerDown(target, { ...touch, pointerType: "mouse" })
    vi.advanceTimersByTime(600)
    fireEvent.click(target)
    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("suppresses the context menu of a held press", () => {
    const { target } = setup()
    fireEvent.pointerDown(target, touch)
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    })
    target.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })
})
