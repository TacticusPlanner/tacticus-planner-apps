import { describe, expect, it } from "vitest"

import { renderHook, waitFor } from "@/test/render"

import { useEventUnitChipNames } from "./use-event-unit-chip-names"

describe("useEventUnitChipNames", () => {
  it("pairs the display name with the unit's first other name", async () => {
    const { result } = renderHook(() => useEventUnitChipNames())
    await waitFor(() => {
      expect(result.current("templHelbrecht")).toEqual({
        displayName: "Helbrecht",
        longName: "High Marshal Helbrecht",
      })
    })
    expect(result.current("templAncient").longName).toBe("Ancient Thoread")
  })

  it("uses the display name when the unit has no other name", async () => {
    const { result } = renderHook(() => useEventUnitChipNames())
    await waitFor(() => {
      expect(result.current("templHelbrecht").displayName).toBe("Helbrecht")
    })
    // `astarCyrus` has a display name but no other names.
    expect(result.current("astarCyrus")).toEqual({
      displayName: "Cyrus",
      longName: "Cyrus",
    })
  })
})
