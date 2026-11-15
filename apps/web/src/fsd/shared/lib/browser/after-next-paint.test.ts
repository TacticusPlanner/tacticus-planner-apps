// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import { afterNextPaint } from "./after-next-paint"

describe("afterNextPaint", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("runs the work in a task after the next animation frame", () => {
    vi.useFakeTimers()
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    })
    const work = vi.fn()

    afterNextPaint(work)
    vi.runAllTimers()
    expect(work).not.toHaveBeenCalled()

    frames[0]?.(0)
    expect(work).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(work).toHaveBeenCalledOnce()
  })

  it("falls back to a timeout without requestAnimationFrame", () => {
    vi.useFakeTimers()
    vi.stubGlobal("requestAnimationFrame", undefined)
    const work = vi.fn()

    afterNextPaint(work)
    vi.runAllTimers()
    expect(work).toHaveBeenCalledOnce()
  })
})
