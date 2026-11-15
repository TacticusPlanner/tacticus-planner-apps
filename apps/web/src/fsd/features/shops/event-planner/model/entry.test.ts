import { describe, expect, it } from "vitest"

import { resolveEntry } from "./entry"
import { purchasableSlotsByDay } from "./slots-by-day"
import { entry, testEvent } from "./test-event.fixture"

const yarrick = entry("THU", 0, "shards_astraYarrick", 2)

describe("resolveEntry", () => {
  it("caps at the largest variant cap without the player's slots", () => {
    expect(resolveEntry(testEvent, yarrick)?.cap).toBe(5)
  })

  it("caps at the player's resolved offer for that day", () => {
    const slotsByDay = purchasableSlotsByDay(testEvent, {})
    const thursday = slotsByDay[3]!
    // The player's power level resolves the slot to a variant sold once a day.
    slotsByDay[3] = thursday.map((slot) =>
      slot.slotIndex === 0
        ? {
            ...slot,
            offers: slot.offers.map((offer) => ({ ...offer, maxPerDay: 1 })),
          }
        : slot
    )

    expect(resolveEntry(testEvent, yarrick, slotsByDay)?.cap).toBe(1)
  })

  it("falls back to the largest cap when the player's slot sells another reward", () => {
    const slotsByDay = purchasableSlotsByDay(testEvent, {}).map((day) =>
      day.filter((slot) => slot.slotIndex !== 0)
    )

    expect(resolveEntry(testEvent, yarrick, slotsByDay)?.cap).toBe(5)
  })
})
