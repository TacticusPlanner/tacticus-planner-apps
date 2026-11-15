import { describe, expect, it } from "vitest"

import { classifyCart } from "./classify"
import { buildDayStates } from "./day-state"
import { buildShoppingList, clearWeekSummary } from "./shopping-list"
import { entry, testEvent, workedCart } from "./test-event.fixture"

const TODAY = 3 // Thu 29 Oct

const listFor = (cart = workedCart, today = TODAY) =>
  buildShoppingList(
    classifyCart(testEvent, cart, today).entries,
    today,
    testEvent.dayCount
  )

describe("classification", () => {
  it("splits a partial past entry into bought and missed", () => {
    const [entryB] = classifyCart(
      testEvent,
      [entry("TUE", 1, "upgArmL021C", 3, 1)],
      TODAY
    ).entries

    expect(entryB).toMatchObject({
      boughtPacks: 1,
      missedPacks: 2,
      toBuyPacks: 0,
      state: "needsReview",
    })
  })

  it("counts today as upcoming", () => {
    const [today] = classifyCart(
      testEvent,
      [entry("THU", 0, "shards_astraYarrick", 2, 0)],
      TODAY
    ).entries

    expect(today).toMatchObject({ toBuyPacks: 2, state: "upcoming" })
  })

  it("flags packs bought before their day", () => {
    const { entries } = classifyCart(testEvent, workedCart, TODAY)

    expect(
      entries.filter((e) => e.boughtAhead).map((e) => e.entry.day)
    ).toEqual(["SAT"])
  })

  it("reports entries the catalog no longer has", () => {
    const stale = entry("TUE", 0, "shards_astraYarrick", 1)

    expect(classifyCart(testEvent, [stale], TODAY).unresolvable).toEqual([
      stale,
    ])
  })
})

describe("shopping list", () => {
  it("adds the worked example up to 390 in cart", () => {
    expect(listFor().totals).toEqual({
      stillToBuy: 90,
      bought: 140,
      missed: 160,
      inCart: 390,
    })
  })

  it("groups needs review, today, later days and done", () => {
    const list = listFor()

    expect(list.needsReview.map((e) => e.entry.day)).toEqual(["TUE", "WED"])
    expect(list.today).toMatchObject({ dayIndex: 3, stillToBuy: 90 })
    expect(list.later).toEqual([])
    expect(list.done.map((e) => e.entry.day)).toEqual(["MON", "SAT"])
    expect(list.doneBought).toBe(110)
    expect(list.all).toHaveLength(1)
    expect(list.all[0]?.days.map((day) => day.dayIndex)).toEqual([
      0, 1, 2, 3, 5,
    ])
    expect(list.weeks).toEqual([1])
    expect(list.ended).toBe(false)
  })

  it("keeps later days with something to buy", () => {
    const list = listFor([
      ...workedCart,
      entry("SUN", 0, "shards_astraYarrick", 1, 0),
    ])

    expect(list.later.map((day) => day.dayIndex)).toEqual([6])
  })

  it("is the recap once the event has ended", () => {
    const list = listFor(workedCart, 13)

    expect(list.ended).toBe(true)
    expect(list.today).toBeNull()
    expect(list.needsReview.map((e) => e.entry.day)).toEqual([
      "TUE",
      "WED",
      "THU",
    ])
    expect(list.totals.inCart).toBe(390)
  })

  it("summarises what Clear week removes", () => {
    expect(
      clearWeekSummary(classifyCart(testEvent, workedCart, TODAY).entries, 1)
    ).toEqual({
      toBuyCount: 1,
      toBuyCost: 90,
      reviewCount: 2,
      reviewBoughtPacks: 1,
    })
  })
})

describe("day states", () => {
  it("colours each day by its most urgent planned item", () => {
    const states = buildDayStates(
      classifyCart(testEvent, workedCart, TODAY).entries,
      testEvent.dayCount
    )

    expect(states.map((day) => day.dot)).toEqual([
      "bought",
      "needsReview",
      "needsReview",
      "toBuy",
      "none",
      "bought",
      "none",
    ])
    expect(states[3]?.items).toEqual([
      { rewardType: "shards_astraYarrick", slotIndex: 0, state: "toBuy" },
    ])
  })
})
