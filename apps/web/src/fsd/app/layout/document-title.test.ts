import { describe, expect, it } from "vitest"

import { documentTitle } from "./document-title"

describe("documentTitle", () => {
  it("uses the active Library child title before the application name", () => {
    expect(documentTitle("Machines of War", "Tacticus Planner")).toBe(
      "Machines of War | Tacticus Planner"
    )
  })

  it("falls back to the application name outside a known navigation route", () => {
    expect(documentTitle(undefined, "Tacticus Planner")).toBe(
      "Tacticus Planner"
    )
  })
})
