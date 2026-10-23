import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { fixtureCharacter } from "@/test/fixtures/legendary-event-characters"
import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import { act, renderHook, waitFor } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { useEventLiveSignals } from "./hse-live-context"
import { HseLiveProvider } from "./hse-live-provider"
import { useNavItems } from "./use-nav-items"

const hunt = {
  definitionId: "hse-machine-hunt",
  startUtc: "2026-10-02T08:00:00Z",
  endUtc: "2026-10-06T08:00:00Z",
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("app shell minute tick", () => {
  it("re-selects the nav and live signals from the cached datasets without reading storage", async () => {
    await seedGameCatalog({
      lres: [lysanderEvent],
      characters: [fixtureCharacter("astarLysander")],
      mows: [],
      "event-definitions": [{ id: hunt.definitionId, type: "HomeScreenEvent" }],
      "events-calendar": { [hunt.startUtc.slice(0, 10)]: [hunt] },
    })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // Thirty seconds before the hunt starts, so the next tick crosses the boundary.
    vi.setSystemTime(new Date("2026-10-02T07:59:30Z"))
    const reads = spyOnIndexedDbReads()

    const { result, queryClient } = renderHook(
      () => ({ items: useNavItems(), live: useEventLiveSignals() }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <HseLiveProvider>{children}</HseLiveProvider>
        ),
      }
    )
    await waitFor(() =>
      expect(
        result.current.items
          .find((item) => item.path === "/legendary-events")
          ?.children?.map((child) => child.path)
      ).toContain("/legendary-events/astarLysander")
    )
    // Every shell read (catalog datasets and the calendar-synced check) has settled.
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(reads.calls()).toBeGreaterThan(0)
    expect(result.current.live.hse).toBe(false)
    const readsBeforeTick = reads.calls()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })

    expect(result.current.live.hse).toBe(true)
    expect(reads.calls()).toBe(readsBeforeTick)
  })
})
