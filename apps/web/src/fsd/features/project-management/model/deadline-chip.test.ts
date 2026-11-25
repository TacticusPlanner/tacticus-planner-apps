import { describe, expect, it } from "vitest"

import { deadlineChipTiming } from "./deadline-chip"

const DAY = 86_400_000
const ready = {
  status: "ready" as const,
  deadlineMs: 10 * DAY,
  endMs: 17 * DAY,
  run: 1 as const,
  estimated: false,
  ended: false,
}

describe("deadlineChipTiming", () => {
  it("is upcoming before the start, running until the end, then ended", () => {
    expect(deadlineChipTiming(ready, 2 * DAY)?.state).toBe("upcoming")
    expect(deadlineChipTiming({ ...ready, ended: true }, 12 * DAY)?.state).toBe(
      "running"
    )
    expect(deadlineChipTiming({ ...ready, ended: true }, 17 * DAY)?.state).toBe(
      "ended"
    )
  })

  it("carries the window, the estimate flag and the clock", () => {
    expect(deadlineChipTiming({ ...ready, estimated: true }, DAY)).toEqual({
      state: "upcoming",
      startMs: 10 * DAY,
      endMs: 17 * DAY,
      estimated: true,
      nowMs: DAY,
    })
  })

  it("has no timing without a resolved deadline", () => {
    expect(deadlineChipTiming(null, 0)).toBeNull()
    expect(deadlineChipTiming({ status: "loading" }, 0)).toBeNull()
    expect(deadlineChipTiming({ status: "unavailable" }, 0)).toBeNull()
  })
})
