import { useEffect, useState } from "react"
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useCampaignEventStatus } from "./use-campaign-event-status"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T>(querier: () => Promise<T>, deps: unknown[]) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))
vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string) => key,
  }),
}))

const eventWindow = {
  definitionId: "campaign-event",
  startUtc: "2026-10-08T08:00:00Z",
  endUtc: "2026-10-15T08:00:00Z",
  confirmed: true,
}
const reads = vi.hoisted(() => ({ at: [] as Date[] }))
vi.mock("@workspace/game-catalog/queries", () => ({
  getEventsActiveAt: async (at: Date) => {
    reads.at.push(at)
    const atMs = at.getTime()
    return Date.parse(eventWindow.startUtc) <= atMs &&
      atMs < Date.parse(eventWindow.endUtc)
      ? [eventWindow]
      : []
  },
}))
vi.mock("@workspace/player-data/queries", () => ({
  getLiveProgress: async () => ({ activeCampaignEventId: "eventCampaign4" }),
}))

describe("useCampaignEventStatus", () => {
  beforeEach(() => {
    reads.at = []
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] })
    vi.setSystemTime(new Date("2026-10-15T07:59:30Z"))
  })
  afterEach(() => vi.useRealTimers())

  it("drops the ended window's countdown on the minute tick while Today stays open", async () => {
    const { result } = renderHook(() => useCampaignEventStatus())
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(result.current.endStatus).toEqual({
      kind: "confirmed",
      targetMs: Date.parse(eventWindow.endUtc),
    })

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(result.current.endStatus).toEqual({ kind: "unavailable" })
    expect(reads.at.at(-1)).toEqual(new Date("2026-10-15T08:00:30Z"))
  })
})
