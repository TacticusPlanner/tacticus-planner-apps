import { describe, expect, it } from "vitest"

import { eventOfferGroups } from "./offer-search"
import { testEvent } from "./test-event.fixture"

describe("eventOfferGroups", () => {
  const groups = eventOfferGroups(testEvent, { todayIndex: 3 })
  const byType = new Map(groups.map((group) => [group.rewardType, group]))

  it("lists the days Yarrick shards are sold, past days marked", () => {
    expect(
      byType
        .get("shards_astraYarrick")
        ?.days.map((day) => [day.date, day.qty, day.cost, day.past])
    ).toEqual([
      ["2026-10-26", 25, 45, true],
      ["2026-10-29", 25, 45, false],
      ["2026-11-01", 25, 45, false],
    ])
  })

  it("lists every other reward the shop sells, not only units", () => {
    expect(byType.get("abilityTokenUncommon_Imperial")?.days).toHaveLength(7)
    expect(byType.has("draft_ascensionOrbsEpic")).toBe(true)
  })
})
