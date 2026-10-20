import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useRunningHse } from "./use-running-hse"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    state: { status: "loading" } as unknown,
    points: { status: "hidden" } as unknown,
    projected: [] as unknown[],
  },
}))

vi.mock("@/features/daily-raids", () => ({
  useActiveHomeScreenEvent: () => mocks.state,
  useHomeScreenEventName: () => (entry: { definitionId: string }) =>
    `name:${entry.definitionId}`,
}))
vi.mock("@/features/home-screen-event-points", () => ({
  useHseProjection: (instance: unknown) => {
    mocks.projected.push(instance)
    return mocks.points
  },
}))

const entry = {
  definitionId: "hse-trait-boost-psyker",
  startUtc: "2026-10-19T00:00:00Z",
  endUtc: "2026-10-23T00:00:00Z",
}
const running = { key: "occ-psyker", status: "running", entry }
const trackers = [{ kind: "KillUnits" }]

beforeEach(() => {
  mocks.state = {
    status: "ready",
    active: entry,
    instances: [{ key: "occ-old", status: "past", entry }, running],
  }
  mocks.points = {
    status: "ready",
    details: { scope: "Personal", trackers },
  }
  mocks.projected = []
})

describe("useRunningHse", () => {
  it("returns the running event's name and trackers", () => {
    const { result } = renderHook(() => useRunningHse())
    expect(mocks.projected.at(-1)).toBe(running)
    expect(result.current).toEqual({
      name: "name:hse-trait-boost-psyker",
      trackers,
    })
  })

  it("is null while no event runs or its scoring is not ready", () => {
    mocks.state = { status: "ready", active: null, instances: [running] }
    mocks.points = { status: "hidden" }
    const { result } = renderHook(() => useRunningHse())
    expect(mocks.projected.at(-1)).toBeNull()
    expect(result.current).toBeNull()
  })

  it("is null for a Global event", () => {
    mocks.points = { status: "ready", details: { scope: "Global", trackers } }
    const { result } = renderHook(() => useRunningHse())
    expect(result.current).toBeNull()
  })
})
