import { describe, expect, it } from "vitest"

import { eventUnitChipLayout } from "./event-unit-chip-layout"

describe("eventUnitChipLayout", () => {
  it("lets a board column's chips follow the column's width", () => {
    expect(eventUnitChipLayout({ fill: true, showName: true })).toEqual({
      kind: "auto",
    })
  })

  it("puts content-sized chips (team and token cards) in a row", () => {
    expect(eventUnitChipLayout({ fill: false, showName: true })).toEqual({
      kind: "row",
    })
  })

  it("stacks a chip that shows no name (the team picker)", () => {
    expect(eventUnitChipLayout({ fill: true, showName: false })).toEqual({
      kind: "stack",
    })
    expect(eventUnitChipLayout({ fill: false, showName: false })).toEqual({
      kind: "stack",
    })
  })
})
