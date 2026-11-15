import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { LegendaryEventProgress } from "@/entities/legendary-event"

import type { ShownToken } from "./token-cleared-analytics"
import { useShownTokens } from "./use-shown-tokens"

const capture = vi.fn()
const analytics = { isReady: true }
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({
    captureEvent: capture,
    isReady: analytics.isReady,
  }),
}))

const shown: ShownToken = {
  run: 1,
  laneId: "alpha",
  battleIndex: 2,
  teamId: "melee",
  clearedIds: [0, 1],
  depth: 4,
  depthManual: false,
  shown: { estimate: 4, fromEstimate: true },
  battle: { battlePower: 8000, powerRatio: 3.1 },
}

const progress = (cleared: number[]) =>
  ({
    id: "votanUthar",
    alpha: {
      encounters: [
        { objectivesCleared: [0] },
        { objectivesCleared: [0] },
        { objectivesCleared: cleared },
      ],
    },
  }) as unknown as LegendaryEventProgress

describe("useShownTokens", () => {
  beforeEach(() => {
    localStorage.clear()
    capture.mockReset()
    analytics.isReady = true
  })

  it("keeps a cleared token until analytics has loaded", () => {
    analytics.isReady = false
    const { result, rerender } = renderHook(
      ({ value }: { value: LegendaryEventProgress }) =>
        useShownTokens("votanUthar", 1, value),
      { initialProps: { value: progress([]) } }
    )
    act(() => result.current.remember(shown))
    rerender({ value: progress([0, 1]) })
    expect(capture).not.toHaveBeenCalled()

    analytics.isReady = true
    rerender({ value: progress([0, 1]) })
    expect(capture).toHaveBeenCalledOnce()
  })

  it("logs a remembered token once a later sync shows it cleared", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: LegendaryEventProgress | "loading" }) =>
        useShownTokens("votanUthar", 1, value),
      { initialProps: { value: progress([]) } }
    )
    act(() => result.current.remember(shown))
    rerender({ value: progress([0]) })
    expect(capture).not.toHaveBeenCalled()

    rerender({ value: progress([0, 1]) })
    expect(capture).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        type: "legendary_event_token_cleared",
        laneId: "alpha",
        battleIndex: 2,
        estimate: 4,
      })
    )
    // Settled tokens are forgotten: the same progress again logs nothing more.
    rerender({ value: progress([0, 1, 2]) })
    expect(capture).toHaveBeenCalledOnce()
  })

  it("logs nothing for a token a card action reported", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: LegendaryEventProgress }) =>
        useShownTokens("votanUthar", 1, value),
      { initialProps: { value: progress([]) } }
    )
    act(() => {
      result.current.remember(shown)
      result.current.forget({ laneId: "alpha", battleIndex: 2 })
    })
    rerender({ value: progress([0, 1]) })
    expect(capture).not.toHaveBeenCalled()
  })
})
