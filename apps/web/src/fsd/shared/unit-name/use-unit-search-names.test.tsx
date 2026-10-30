import { describe, expect, it } from "vitest"

import { renderHook, waitFor } from "@/test/render"

import { useUnitSearchNames } from "./use-unit-search-names"

describe("useUnitSearchNames", () => {
  it("resolves a unit's short and full names besides the displayed one", async () => {
    const { result } = renderHook(() => useUnitSearchNames())
    await waitFor(() => {
      expect(result.current("deathRotbone")).toEqual(["Nauseous Rotbone"])
    })
    expect(result.current("orksWarboss")).toEqual([
      "Boss Gulgortz",
      "Gulgortz Bulldoza",
    ])
  })

  it("is empty for an id the namespace doesn't know", async () => {
    const { result } = renderHook(() => useUnitSearchNames())
    await waitFor(() => {
      expect(result.current("deathRotbone")).not.toHaveLength(0)
    })
    expect(result.current("not-a-unit")).toEqual([])
  })
})
