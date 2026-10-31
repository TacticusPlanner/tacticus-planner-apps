import { describe, expect, it } from "vitest"

import { getDeviceLocale } from "./device-locale"

describe("getDeviceLocale", () => {
  it("returns the runtime's default (device) locale", () => {
    expect(getDeviceLocale()).toBe(
      new Intl.DateTimeFormat().resolvedOptions().locale
    )
  })
})
