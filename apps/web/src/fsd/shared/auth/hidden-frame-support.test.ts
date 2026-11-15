import { describe, expect, it } from "vitest"

import { hiddenFrameCannotSeeSession } from "./hidden-frame-support"

const UA = {
  chrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  safari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  chromeIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
  firefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
}

describe("hiddenFrameCannotSeeSession", () => {
  it("is true for Safari, every iOS browser and Firefox", () => {
    for (const ua of [UA.safari, UA.iphone, UA.chromeIos, UA.firefox]) {
      expect(hiddenFrameCannotSeeSession(ua, false)).toBe(true)
    }
  })

  it("is true for Brave, whose user agent reads as Chrome", () => {
    expect(hiddenFrameCannotSeeSession(UA.chrome, true)).toBe(true)
  })

  it("is false for Chrome and Edge", () => {
    for (const ua of [UA.chrome, UA.chromeMac, UA.edge]) {
      expect(hiddenFrameCannotSeeSession(ua, false)).toBe(false)
    }
  })
})
