import { describe, expect, it } from "vitest"

import type { ShopRecommendationSectionView } from "@/features/shops/recommendations"

import { shopsGlanceOf } from "./shops-glance"

const section = (guaranteed: number, possible: number) =>
  ({
    shopId: "guild",
    guaranteed: Array.from({ length: guaranteed }, () => ({})),
    possible: Array.from({ length: possible }, () => ({})),
  }) as unknown as ShopRecommendationSectionView

describe("shopsGlanceOf", () => {
  it("counts guaranteed buys and possible offers across every shop", () => {
    expect(
      shopsGlanceOf({
        status: "ready",
        sections: [section(2, 1), section(1, 1)],
      })
    ).toEqual({ status: "ready", toBuy: 3, possible: 2 })
  })

  it("loads with the card, and hides the tile when there are no goals or the read failed", () => {
    expect(shopsGlanceOf({ status: "loading" })).toEqual({ status: "loading" })
    expect(shopsGlanceOf({ status: "no-goals" })).toBeNull()
    expect(shopsGlanceOf({ status: "error", retry: () => {} })).toBeNull()
  })
})
