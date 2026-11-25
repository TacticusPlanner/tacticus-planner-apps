import { describe, expect, it } from "vitest"

import { portraitVariationOf } from "./portrait-variation"

const group = (defaultVariationId: string, ...ids: string[]) => ({
  defaultVariationId,
  variations: ids.map((id) => ({ id })) as never,
})

describe("portraitVariationOf", () => {
  it("borrows the portrait of another variation in the group", () => {
    // Only the Survival variation has a mapped portrait.
    expect(
      portraitVariationOf(
        group("bloodBossDante", "bloodBossDante", "bloodBossDanteSurv")
      )
    ).toBe("bloodBossDanteSurv")
  })

  it("keeps the preferred variation when it has a portrait or none does", () => {
    expect(
      portraitVariationOf(group("bloodBossDanteSurv", "bloodBossDanteSurv"))
    ).toBe("bloodBossDanteSurv")
    expect(portraitVariationOf(group("noSuchNpc", "noSuchNpc"))).toBe(
      "noSuchNpc"
    )
  })
})
