import { describe, expect, it } from "vitest"

import { rotationEventIds } from "./npc-tier-list.view-model"

const DAY = 86_400_000
const now = Date.parse("2026-11-09T00:00:00Z")
const iso = (ms: number) => new Date(ms).toISOString()

describe("rotationEventIds", () => {
  it("keeps running and upcoming events, running first, and drops archived ones", () => {
    const events = [
      { id: "upcoming", eventStageStartDatesUtc: [iso(now + 30 * DAY)] },
      {
        id: "archived",
        eventStageStartDatesUtc: [
          iso(now - 300 * DAY),
          iso(now - 200 * DAY),
          iso(now - 100 * DAY),
        ],
      },
      { id: "tba", eventStageStartDatesUtc: [] },
      { id: "running", eventStageStartDatesUtc: [iso(now - DAY)] },
    ]
    expect(rotationEventIds(events, now)).toEqual([
      "running",
      "upcoming",
      "tba",
    ])
  })
})
