import { describe, expect, it, vi } from "vitest"

const getProgress = vi.hoisted(() => vi.fn())

vi.mock("./onslaught-progress.api", () => ({
  getOnslaughtProgress: getProgress,
}))

import { QueryClient } from "@tanstack/react-query"

import { campaignEventProgressQueries } from "./campaign-event-progress.queries"
import { onslaughtProgressQueries } from "./onslaught-progress.queries"

describe("onslaught progress queries", () => {
  it("builds a resource key and delegates its query", async () => {
    const signal = new AbortController().signal
    const query = onslaughtProgressQueries.current()

    await query.queryFn?.({ signal } as never)

    expect(onslaughtProgressQueries.all()).toEqual([
      "player-data-overrides",
      "onslaught",
    ])
    expect(query.queryKey).toEqual([
      "player-data-overrides",
      "onslaught",
      "current",
    ])
    expect(getProgress).toHaveBeenCalledWith(signal)
  })

  it("does not share a prefix with the campaign-events override", async () => {
    const client = new QueryClient()
    client.setQueryData(campaignEventProgressQueries.current().queryKey, {
      progress: [],
      revision: 1,
    })
    client.setQueryData(
      onslaughtProgressQueries.current().queryKey,
      {} as never
    )

    await client.invalidateQueries({ queryKey: onslaughtProgressQueries.all() })

    expect(
      client
        .getQueryCache()
        .find({ queryKey: campaignEventProgressQueries.current().queryKey })
        ?.state.isInvalidated
    ).toBe(false)
    expect(
      client
        .getQueryCache()
        .find({ queryKey: onslaughtProgressQueries.current().queryKey })?.state
        .isInvalidated
    ).toBe(true)
  })
})
