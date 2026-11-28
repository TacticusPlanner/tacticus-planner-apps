import { afterEach, describe, expect, it, vi } from "vitest"

import { dateTimeFormat } from "./format-date-time"

describe("dateTimeFormat", () => {
  it("formats in the given locale and options", () => {
    const date = Date.UTC(2026, 10, 22)
    expect(
      dateTimeFormat("en", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    ).toBe("November 2026")
    expect(
      dateTimeFormat("de", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    ).toBe("November 2026")
    expect(
      dateTimeFormat("fr", { month: "long", timeZone: "UTC" }).format(date)
    ).toBe("novembre")
  })

  it("reuses one format for the same locale and options", () => {
    const options = { day: "numeric" } as const
    expect(dateTimeFormat("en", options)).toBe(
      dateTimeFormat("en", { day: "numeric" })
    )
    expect(dateTimeFormat("en", options)).not.toBe(
      dateTimeFormat("de", options)
    )
    expect(dateTimeFormat(undefined)).not.toBe(dateTimeFormat("en"))
  })
  it("makes a new format when the device time zone changes", () => {
    const options = { hour: "numeric", minute: "2-digit" } as const
    const instant = Date.UTC(2026, 9, 9, 18)
    vi.stubEnv("TZ", "UTC")
    const utc = dateTimeFormat("en", options).format(instant)
    vi.stubEnv("TZ", "Pacific/Honolulu")
    const honolulu = dateTimeFormat("en", options).format(instant)
    expect(utc).toBe("6:00 PM")
    expect(honolulu).toBe("8:00 AM")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })
})
