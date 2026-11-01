import { describe, expect, it } from "vitest"

import { minutesUntil, stagingTransferMode } from "./staging-transfer"

describe("stagingTransferMode", () => {
  it("mints codes in production and redeems them on staging", () => {
    expect(stagingTransferMode("production", true)).toBe("export")
    expect(stagingTransferMode("staging", true)).toBe("import")
  })

  it("offers nothing locally or while the flag is off", () => {
    expect(stagingTransferMode("local", true)).toBeNull()
    expect(stagingTransferMode("production", false)).toBeNull()
    expect(stagingTransferMode("staging", false)).toBeNull()
  })
})

describe("minutesUntil", () => {
  const now = Date.parse("2026-11-01T12:00:00Z")

  it("rounds a partial minute up", () => {
    expect(minutesUntil("2026-11-01T12:09:01Z", now)).toBe(10)
    expect(minutesUntil("2026-11-01T12:10:00Z", now)).toBe(10)
  })

  it("never goes below zero", () => {
    expect(minutesUntil("2026-11-01T11:00:00Z", now)).toBe(0)
  })
})
