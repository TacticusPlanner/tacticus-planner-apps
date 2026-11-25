import { describe, expect, it } from "vitest"

import { homeCardLimit } from "./home-card-limit"

describe("homeCardLimit", () => {
  it("shows 5 items per Home card on desktop and 3 on a phone", () => {
    expect(homeCardLimit(false)).toBe(5)
    expect(homeCardLimit(true)).toBe(3)
  })
})
