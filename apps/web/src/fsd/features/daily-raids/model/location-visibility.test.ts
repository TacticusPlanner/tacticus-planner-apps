import { describe, expect, it } from "vitest"
import { battleIdSchema } from "@workspace/game-domain"

import { isLocationVisible } from "./location-visibility"

const b1 = battleIdSchema.parse("B1")

describe("isLocationVisible", () => {
  it("is visible when real attempts remain", () => {
    expect(isLocationVisible({ battleId: b1 }, new Map([[b1, 3]]))).toBe(true)
  })

  it("is not visible once real attempts hit zero", () => {
    expect(isLocationVisible({ battleId: b1 }, new Map([[b1, 0]]))).toBe(false)
  })

  it("is visible when there is no real data at all, rather than guessed at", () => {
    expect(isLocationVisible({ battleId: b1 }, new Map())).toBe(true)
  })
})
