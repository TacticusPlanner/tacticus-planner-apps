import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getOverrides = vi.hoisted(() => vi.fn())

vi.mock("./campaign-event-progress.api", () => ({
  getCampaignEventProgressOverrides: getOverrides,
}))

import { campaignEventProgressQueries } from "./campaign-event-progress.queries"

// Same defaults as app/providers/query-provider.tsx: every query is stale immediately unless it
// says otherwise.
const appClient = () =>
  new QueryClient({
    defaultOptions: { queries: { staleTime: 0, retry: false } },
  })

describe("campaign event progress queries", () => {
  beforeEach(() => {
    getOverrides.mockReset().mockResolvedValue({ progress: [], revision: 1 })
  })

  it("lets every eligibility consumer share one fetch instead of refetching on mount", async () => {
    const client = appClient()
    await client.fetchQuery(campaignEventProgressQueries.current())
    await client.fetchQuery(campaignEventProgressQueries.current())
    expect(getOverrides).toHaveBeenCalledTimes(1)
  })

  it("still refetches when a caller forces it (the reload after a 409)", async () => {
    const client = appClient()
    await client.fetchQuery(campaignEventProgressQueries.current())
    await client.fetchQuery({
      ...campaignEventProgressQueries.current(),
      staleTime: 0,
    })
    expect(getOverrides).toHaveBeenCalledTimes(2)
  })
})
