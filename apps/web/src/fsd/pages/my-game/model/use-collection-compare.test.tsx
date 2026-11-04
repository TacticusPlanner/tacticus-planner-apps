import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { readCompareQuery } from "./compare-query"
import type { CompareQueryState } from "./use-compare-query"

const flags = vi.hoisted(() => ({ rosterSnapshots: true }))
vi.mock("@/shared/feature-flags", () => ({
  useFeatureFlag: (flag: string) =>
    flag === "RosterSnapshots" && flags.rosterSnapshots,
}))
vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
const data = vi.hoisted(() => ({ enabled: [] as boolean[] }))
vi.mock("./use-compare-data", () => ({
  useCompareSources: (enabled: boolean) => {
    data.enabled.push(enabled)
    return { status: "loading" }
  },
  useSourceRoster: () => ({ status: "loading" }),
  useRosterDiffContext: () => ({ status: "loading" }),
}))

import { useCollectionCompare } from "./use-collection-compare"

const compare = (compareId: string | null): CompareQueryState =>
  ({
    query: readCompareQuery(
      new URLSearchParams(compareId ? { compare: compareId } : {})
    ).query,
    applyFixes: vi.fn(),
  }) as unknown as CompareQueryState

beforeEach(() => {
  flags.rosterSnapshots = true
  data.enabled = []
})

describe("useCollectionCompare", () => {
  it("loads the sources for a compare URL while the RosterSnapshots flag is on", () => {
    const { result } = renderHook(() => useCollectionCompare(compare("latest")))

    expect(result.current.state.mode).toBe("loading")
    expect(data.enabled).toContain(true)
  })

  it("ignores a compare URL and requests nothing while the flag is off", () => {
    flags.rosterSnapshots = false

    const { result } = renderHook(() => useCollectionCompare(compare("latest")))

    expect(result.current.state.mode).toBe("off")
    expect(data.enabled).not.toContain(true)
  })
})
