import { describe, expect, it } from "vitest"

import { getDeviceFirstDayOfWeek, resolveDateLocale } from "./date-locale"

const instant = new Date(Date.UTC(2026, 9, 31, 15, 20))
const format = (locale: string) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(instant)

describe("resolveDateLocale", () => {
  it("keeps the UI language's words but takes the device's region and clock", () => {
    const locale = resolveDateLocale("en", "uk-UA")
    expect(new Intl.Locale(locale).language).toBe("en")
    expect(new Intl.Locale(locale).region).toBe("UA")
    expect(format(locale)).toBe("31 Oct 2026, 15:20")
  })

  it("carries a 12-hour device clock into another UI language", () => {
    expect(format(resolveDateLocale("de", "en-US"))).toContain("PM")
  })

  it("uses the device locale as is when it already speaks the UI language", () => {
    expect(resolveDateLocale("en", "en-GB")).toBe("en-GB")
  })

  it("infers the region from a region-less device locale", () => {
    expect(new Intl.Locale(resolveDateLocale("en", "uk")).region).toBe("UA")
  })

  it("falls back to the UI language for an unparseable device locale", () => {
    expect(resolveDateLocale("en", "not a locale")).toBe("en")
  })
})

describe("getDeviceFirstDayOfWeek", () => {
  it("returns a Date#getDay number", () => {
    expect(getDeviceFirstDayOfWeek("uk-UA")).toBe(1)
    expect([0, 1]).toContain(getDeviceFirstDayOfWeek("en-US"))
  })

  it("falls back to Monday for an unparseable locale", () => {
    expect(getDeviceFirstDayOfWeek("not a locale")).toBe(1)
  })
})
