import { describe, expect, it, vi } from "vitest"

const getProgress = vi.hoisted(() => vi.fn())

vi.mock("./onslaught-progress.api", () => ({
  getOnslaughtProgress: getProgress,
}))

import { onslaughtProgressQueries } from "./onslaught-progress.queries"

describe("onslaught progress queries", () => {
  it("builds a resource key and delegates its query", async () => {
    const signal = new AbortController().signal
    const query = onslaughtProgressQueries.current()

    await query.queryFn?.({ signal } as never)

    expect(onslaughtProgressQueries.all()).toEqual(["player-data-overrides"])
    expect(query.queryKey).toEqual(["player-data-overrides", "onslaught"])
    expect(getProgress).toHaveBeenCalledWith(signal)
  })
})
