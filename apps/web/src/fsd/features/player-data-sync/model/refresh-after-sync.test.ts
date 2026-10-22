import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { goalQueries } from "@/entities/goal"
import { legendaryEventPlanQueries } from "@/entities/legendary-event"

import { refreshServerReadsAfterSync } from "./refresh-after-sync"

const invalidated = (client: QueryClient, queryKey: readonly unknown[]) =>
  client.getQueryState(queryKey)?.isInvalidated

describe("refreshServerReadsAfterSync", () => {
  it("invalidates goals, every event's run records and their rosters, and the plan list, not the plan details", async () => {
    const client = new QueryClient()
    const uthar = legendaryEventPlanQueries.runRecords("votanUthar").queryKey
    const other = legendaryEventPlanQueries.runRecords("other").queryKey
    const roster = legendaryEventPlanQueries.runRecordRoster(
      "votanUthar",
      "record-run-1"
    ).queryKey
    const list = legendaryEventPlanQueries.list().queryKey
    const detail = legendaryEventPlanQueries.detail("votanUthar").queryKey
    for (const key of [uthar, other, roster, list, detail, goalQueries.all()]) {
      client.setQueryData(key, [])
    }

    await refreshServerReadsAfterSync(client)

    expect(invalidated(client, uthar)).toBe(true)
    expect(invalidated(client, other)).toBe(true)
    expect(invalidated(client, roster)).toBe(true)
    expect(invalidated(client, list)).toBe(true)
    expect(invalidated(client, goalQueries.all())).toBe(true)
    // A plan detail may hold optimistic edits; the sync does not change it.
    expect(invalidated(client, detail)).toBe(false)
  })
})
