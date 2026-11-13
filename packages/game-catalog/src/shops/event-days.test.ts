import { describe, expect, it } from "vitest"

import { datasetPayloadSchemas } from "../schemas"
import fixture from "./event-shops.fixture.json"
import {
  defaultEventDay,
  eventDay,
  eventDayIndex,
  eventDays,
  eventStatus,
  resolveEventDaySlots,
} from "./event-days"
import { bpSeasonStartMs } from "./season-locks"
import { computeShopLockContext } from "./shop-resolve"

// A trimmed copy of the served `event-shops` payload: August 2026 (2 weeks from Sun 2 Aug, no slots) and
// October 2026 (1 week from Mon 26 Oct, the game's first 8 slots).
const events = datasetPayloadSchemas["event-shops"].parse(fixture)
const august = events.find((event) => event.id === "august-2026")!
const october = events.find((event) => event.id === "october-2026")!

const at = (iso: string) => Date.parse(iso)

describe("event day mapping", () => {
  it("maps an instant to its event day, week, date and weekday", () => {
    const now = at("2026-08-13T10:00:00Z")

    expect(eventDayIndex(august, now)).toBe(11)
    expect(eventStatus(august, now)).toBe("running")
    expect(eventDay(august, 11)).toEqual({
      index: 11,
      week: 2,
      date: "2026-08-13",
      dow: "THU",
    })
  })

  it("follows a Wednesday-start event's own week", () => {
    const wednesdayStart = { ...august, startUtc: "2026-08-05T00:00:00Z" }

    expect(eventDayIndex(wednesdayStart, at("2026-08-13T10:00:00Z"))).toBe(8)
    expect(eventDay(wednesdayStart, 8)).toMatchObject({
      week: 2,
      date: "2026-08-13",
      dow: "THU",
    })
    expect(
      eventDays(wednesdayStart)
        .map((day) => day.dow)
        .slice(0, 7)
    ).toEqual(["WED", "THU", "FRI", "SAT", "SUN", "MON", "TUE"])
  })

  it("defaults to day 0 before the event and the last day after it", () => {
    expect(eventStatus(october, at("2026-10-20T00:00:00Z"))).toBe("upcoming")
    expect(defaultEventDay(october, at("2026-10-20T00:00:00Z"))).toBe(0)
    expect(eventStatus(october, at("2026-11-09T00:00:00Z"))).toBe("ended")
    expect(defaultEventDay(october, at("2026-11-09T00:00:00Z"))).toBe(6)
    expect(defaultEventDay(october, at("2026-10-29T23:59:59Z"))).toBe(3)
  })

  it("changes day at 00:00 UTC", () => {
    expect(eventDayIndex(october, at("2026-10-28T23:59:59Z"))).toBe(2)
    expect(eventDayIndex(october, at("2026-10-29T00:00:00Z"))).toBe(3)
  })
})

describe("resolveEventDaySlots", () => {
  const now = at("2026-10-29T12:00:00Z")
  const yarrickOffer = (dayIndex: number, stars?: number) =>
    resolveEventDaySlots(october, dayIndex, {
      powerLevel: 50,
      lockContext:
        stars === undefined
          ? computeShopLockContext(50, [], [])
          : computeShopLockContext(50, [{ unitId: "astraYarrick", stars }], []),
      now,
    }).find((slot) => slot.slotIndex === 1)

  it("sells Yarrick shards on Monday, Thursday and Sunday only", () => {
    const yarrickDays = [0, 1, 2, 3, 4, 5, 6].filter((dayIndex) =>
      resolveEventDaySlots(october, dayIndex, { now })
        .find((slot) => slot.slotIndex === 1)
        ?.offers.some((offer) => offer.rewardType === "shards_astraYarrick")
    )

    expect(yarrickDays).toEqual([0, 3, 6])
  })

  it("resolves the Yarrick slot from the roster", () => {
    expect(yarrickOffer(3, 5)?.offers.map((offer) => offer.rewardType)).toEqual(
      ["shards_astraYarrick"]
    )
    expect(
      yarrickOffer(3, 20)?.offers.map((offer) => offer.rewardType)
    ).toEqual(["mythicShards_astraYarrick"])
    // Not unlocked yet: regular shards.
    expect(yarrickOffer(3)?.offers.map((offer) => offer.rewardType)).toEqual([
      "shards_astraYarrick",
    ])
  })

  it("resolves slot 7 to mythic orbs at the high tier", () => {
    const lockContext = computeShopLockContext(
      50,
      [{ unitId: "ultraCalgar", stars: 20 }],
      []
    )
    const slot7 = resolveEventDaySlots(october, 3, {
      powerLevel: 50,
      lockContext,
      now,
    }).find((slot) => slot.slotIndex === 6)

    expect(slot7?.offers).toEqual([
      expect.objectContaining({
        rewardType: "heroAscensionOrbMythic_Imperial",
        rewardQty: 5,
        isGuaranteed: true,
      }),
    ])
  })

  it("lists every option of a slot without a lock context", () => {
    const slot7 = resolveEventDaySlots(october, 3, { now }).find(
      (slot) => slot.slotIndex === 6
    )

    expect(slot7?.offers.map((offer) => offer.rewardType).sort()).toEqual([
      "heroAscensionOrbEpic_Imperial",
      "heroAscensionOrbLegendary_Imperial",
      "heroAscensionOrbMythic_Imperial",
    ])
    expect(slot7?.variants.map((variant) => variant.lockId).sort()).toEqual([
      "lock_mythic_shop_tier_high",
      "lock_mythic_shop_tier_low",
      "lock_mythic_shop_tier_medium",
    ])
  })

  it("keeps each slot's index and drops slots not sold that day", () => {
    const indexes = resolveEventDaySlots(october, 1, { now }).map(
      (slot) => slot.slotIndex
    )

    expect(indexes[0]).toBe(0)
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
  })

  it("resolves a future day's season locks as of that day, not today", () => {
    const dayMs = 86_400_000
    // The event starts 3 days before the day battle-pass season 41 starts.
    const start = Math.floor(bpSeasonStartMs(41) / dayMs) * dayMs - 3 * dayMs
    const week = october.weeks[0]!
    const template = week.slots[0]!.variants[0]!
    const variant = (rewardType: string, lockId: string) => ({
      ...template,
      days: eventDays(october).map((day) => day.dow),
      reward: { ...template.reward, type: rewardType },
      unitId: undefined,
      lockId,
    })
    const event = {
      ...october,
      startUtc: new Date(start).toISOString(),
      weeks: [
        {
          ...week,
          slots: [
            {
              ...week.slots[0]!,
              variants: [
                variant("gold", "lock_valid_until_bp_season_41_start"),
                variant("gems", "lock_valid_after_bp_season_41_start"),
              ],
            },
          ],
        },
      ],
    }
    const offeredOn = (dayIndex: number) =>
      resolveEventDaySlots(event, dayIndex, {
        lockContext: computeShopLockContext(50, [], []),
        now: start + 12 * 3_600_000,
      })[0]?.offers.map((offer) => offer.rewardType)

    expect(offeredOn(0)).toEqual(["gold"])
    expect(offeredOn(5)).toEqual(["gems"])
  })

  it("returns nothing for a day outside the event", () => {
    expect(resolveEventDaySlots(october, 9, { now })).toEqual([])
  })
})
