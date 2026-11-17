import { describe, expect, it } from "vitest"

import { eventShopBudget } from "./budget"

const week = (income?: { free: number; bonusShipment: number }) =>
  ({ estimatedWeeklyIncome: income }) as never

describe("eventShopBudget", () => {
  it("sums every week's income and spends bought plus still to buy", () => {
    const event = {
      weeks: [
        week({ free: 750, bonusShipment: 1000 }),
        week({ free: 750, bonusShipment: 1000 }),
      ],
    }

    expect(eventShopBudget(event, { bought: 140, stillToBuy: 90 })).toEqual({
      spend: 230,
      free: 1500,
      withBonus: 3500,
    })
  })

  it("has no budget when a week has no estimated income", () => {
    const event = { weeks: [week({ free: 850, bonusShipment: 1100 }), week()] }

    expect(eventShopBudget(event, { bought: 0, stillToBuy: 0 })).toBeNull()
  })

  it("has no budget for an event without weeks", () => {
    expect(
      eventShopBudget({ weeks: [] }, { bought: 0, stillToBuy: 0 })
    ).toBeNull()
  })
})
