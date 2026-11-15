import { describe, expect, it } from "vitest"
import type { ResolvedEventSlot } from "@workspace/game-catalog"

import { dailyFreebie, withoutFreebies } from "./freebie"

const currency = "seasonalEventCurrencyOctober2026"
const slot = (freeQty: number | null, cost = 1): ResolvedEventSlot => ({
  slotIndex: 0,
  offers: [
    {
      rewardType: "gold",
      rewardQty: 1,
      cost: { currency, amount: cost },
      maxPerDay: 1,
    } as ResolvedEventSlot["offers"][number],
  ],
  variants: [
    {
      reward: { type: "gold", qty: 1 },
      cost: { currency, amount: cost },
      maxPurchasesPerDay: 1,
      days: ["MON"],
      ...(freeQty === null
        ? {}
        : { freeOffer: { type: currency, qty: freeQty } }),
    },
  ],
})

describe("dailyFreebie", () => {
  it("spots the pack that pays back more event currency than it costs", () => {
    expect(dailyFreebie({ currency }, slot(5), "gold")).toEqual({
      cost: 1,
      back: 5,
    })
  })

  it("leaves ordinary packs alone", () => {
    expect(dailyFreebie({ currency }, slot(null), "gold")).toBeNull()
    expect(dailyFreebie({ currency }, slot(5, 45), "gold")).toBeNull()
    expect(
      dailyFreebie({ currency }, slot(5), "shards_astraYarrick")
    ).toBeNull()
  })
})

describe("withoutFreebies", () => {
  it("drops the freebie from what can be bought and keeps ordinary packs", () => {
    expect(withoutFreebies({ currency }, [slot(5)])[0]?.offers).toEqual([])
    expect(
      withoutFreebies({ currency }, [slot(5, 45)])[0]?.offers
    ).toHaveLength(1)
  })
})
