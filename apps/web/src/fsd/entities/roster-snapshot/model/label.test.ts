import { describe, expect, it } from "vitest"

import { hasDefaultName, snapshotLabel } from "./label"

const labels = {
  auto: (date: string) => `Auto · ${date}`,
  v1Import: (name: string) => `V1 · ${name}`,
}

describe("snapshotLabel", () => {
  it("names an automatic snapshot by its date, with the year", () => {
    expect(
      snapshotLabel(
        { name: "2026-11-03", source: "auto", takenAt: "2026-11-03T10:00:00Z" },
        "en",
        labels
      )
    ).toBe("Auto · Nov 3, 2026")
  })

  it("shows a renamed automatic snapshot's new name", () => {
    expect(
      snapshotLabel(
        { name: "Pre-raid", source: "auto", takenAt: "2026-11-03T10:00:00Z" },
        "en",
        labels
      )
    ).toBe("Pre-raid")
  })

  it("treats a rename to another date as the user's own name", () => {
    const renamed = {
      name: "2026-10-30",
      source: "auto" as const,
      takenAt: "2026-11-03T10:00:00Z",
    }
    expect(hasDefaultName(renamed)).toBe(false)
    expect(snapshotLabel(renamed, "en", labels)).toBe("2026-10-30")
    // The default is the UTC date, even when the local date differs.
    expect(
      hasDefaultName({ name: "2026-11-03", takenAt: "2026-11-03T23:30:00Z" })
    ).toBe(true)
  })

  it("prefixes a V1 import and leaves a manual snapshot as named", () => {
    expect(
      snapshotLabel(
        { name: "Oct", source: "v1Import", takenAt: "2026-10-01T10:00:00Z" },
        "en",
        labels
      )
    ).toBe("V1 · Oct")
    expect(
      snapshotLabel(
        { name: "Mine", source: "manual", takenAt: "2026-10-01T10:00:00Z" },
        "en",
        labels
      )
    ).toBe("Mine")
  })
})
