import { describe, expect, it } from "vitest"

import { detectInstallPlatform } from "./install-platform"

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  macFirefox:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:131.0) Gecko/20100101 Firefox/131.0",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  androidFirefox:
    "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0",
  windowsEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  windowsFirefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
}

describe("detectInstallPlatform", () => {
  it.each([
    ["iphoneSafari", 5, "ios"],
    ["iphoneChrome", 5, "ios"],
    // iPadOS reports a Mac user agent; the touch screen gives it away.
    ["macSafari", 5, "ios"],
    ["macSafari", 0, "macSafari"],
    ["macChrome", 0, "desktop"],
    ["macFirefox", 0, "unsupported"],
    ["androidChrome", 5, "android"],
    ["androidFirefox", 5, "android"],
    ["windowsEdge", 0, "desktop"],
    ["windowsFirefox", 0, "unsupported"],
  ] as const)("%s with %i touch points is %s", (ua, touchPoints, expected) => {
    expect(detectInstallPlatform(UA[ua], touchPoints)).toBe(expected)
  })
})
