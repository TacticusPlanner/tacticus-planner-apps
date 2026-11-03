import { describe, expect, it } from "vitest"

import { formatRosterSourceId, parseRosterSourceId } from "./source"

describe("roster source ids", () => {
  it.each([
    ["current", { kind: "current" }],
    ["0b6b2f5e-1", { kind: "snapshot", snapshotId: "0b6b2f5e-1" }],
    ["le:uthar:r1", { kind: "runRecord", eventId: "uthar", recordId: "r1" }],
  ] as const)("round-trips %s", (value, source) => {
    expect(parseRosterSourceId(value)).toEqual(source)
    expect(formatRosterSourceId(source)).toBe(value)
  })

  it.each(["", "le:uthar", "le::r1", "le:a:b:c", "a:b"])(
    "rejects %j",
    (value) => {
      expect(parseRosterSourceId(value)).toBeNull()
    }
  )
})
