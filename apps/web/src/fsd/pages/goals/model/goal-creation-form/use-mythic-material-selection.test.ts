import { describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import type { ShopRewardOffer } from "@workspace/game-catalog"

const venerable = (
  shopId: string,
  currency: string,
  amount: number,
  maxPerDay: number
): ShopRewardOffer => ({
  offerId: `${shopId}:upgHpM004`,
  shopId,
  rewardType: "upgHpM004",
  rewardQty: 1,
  cost: { currency, amount },
  maxPerDay,
  days: ["TUE", "SAT", "SUN"],
  probabilityByDay: { TUE: 1, SAT: 0.25, SUN: 0.25 },
})
const offers = [
  venerable("guild", "guildCredits", 900, 2),
  venerable("crusade", "crusadeCurrency", 430, 3),
  {
    ...venerable("rogue-trader", "elderShopCurrency", 35, 1),
    days: ["SUN"],
    probabilityByDay: { SUN: 1 },
  } satisfies ShopRewardOffer,
]

vi.mock("@/features/goal-farming", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/goal-farming")>()),
  useMythicMaterialShopOffers: () => ({ offers, failed: false }),
}))

import { useMythicMaterialSelection } from "./use-mythic-material-selection"

const needs = [
  { id: "upgHpM004", missing: 6 },
  { id: "upgDmgL202", missing: 3 },
]

describe("useMythicMaterialSelection", () => {
  it("defaults to every listed offer and saves nothing", () => {
    const { result } = renderHook(() => useMythicMaterialSelection({ needs }))

    expect(result.current.materialIds).toEqual(["upgHpM004"])
    expect(result.current.checkedIds).toEqual(offers.map((o) => o.offerId))
    expect(result.current.acquisitionSources).toBeNull()
    expect(result.current.changed).toBe(false)
  })

  it("previews Ragnar's spend from a Monday: ⌈3.75⌉ × 430 crusade and ⌈2.25⌉ × 900 Guild", () => {
    const { result } = renderHook(() =>
      useMythicMaterialSelection({
        needs,
        referenceDate: new Date(Date.UTC(2026, 9, 5)),
      })
    )

    expect(result.current.currencySpend).toEqual([
      { currency: "guildCredits", amount: 2700 },
      { currency: "crusadeCurrency", amount: 1720 },
    ])
  })

  it("pins the listed offers on the first toggle, and opts out when all are unchecked", () => {
    const { result } = renderHook(() => useMythicMaterialSelection({ needs }))

    act(() => result.current.toggle("guild:upgHpM004", false))
    expect(result.current.acquisitionSources).toEqual([
      { kind: "Shop", ids: ["crusade:upgHpM004", "rogue-trader:upgHpM004"] },
    ])
    expect(result.current.changed).toBe(true)

    act(() => result.current.toggle("crusade:upgHpM004", false))
    act(() => result.current.toggle("rogue-trader:upgHpM004", false))
    expect(result.current.acquisitionSources).toEqual([
      { kind: "Shop", ids: [] },
    ])
    expect(result.current.currencySpend).toEqual([])
  })

  it("seeds from a saved selection and resets when the unit changes", () => {
    const seed = [{ kind: "Shop", ids: ["crusade:upgHpM004"] }]
    const { result, rerender } = renderHook(
      ({ resetKey }) => useMythicMaterialSelection({ needs, seed, resetKey }),
      { initialProps: { resetKey: "spaceRagnar" } }
    )
    expect(result.current.checkedIds).toEqual(["crusade:upgHpM004"])

    act(() => result.current.toggle("guild:upgHpM004", true))
    rerender({ resetKey: "ultraCalgar" })

    expect(result.current.checkedIds).toEqual(["crusade:upgHpM004"])
    expect(result.current.changed).toBe(false)
  })
})
