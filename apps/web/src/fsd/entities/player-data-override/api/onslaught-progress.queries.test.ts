import { describe, expect, it, vi } from "vitest"

const getProgress = vi.hoisted(() => vi.fn())

vi.mock("./onslaught-progress.api", () => ({
  getOnslaughtProgress: getProgress,
}))

import { onslaughtProgressQueries } from "./onslaught-progress.queries"

describe("onslaught progress queries", () => {
  it("builds an account-scoped key and delegates its query", async () => {
    const signal = new AbortController().signal
    const query = onslaughtProgressQueries.current("account-1")

    await query.queryFn?.({ signal } as never)

    expect(onslaughtProgressQueries.all("account-1")).toEqual([
      "account",
      "account-1",
      "player-data-overrides",
    ])
    expect(query.queryKey).toEqual([
      "account",
      "account-1",
      "player-data-overrides",
      "onslaught",
    ])
    expect(getProgress).toHaveBeenCalledWith(signal)
  })
})
