import { act, renderHook } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { useLookupSelection } from "./use-lookup-selection"

function renderSelection(initialEntry = "/") {
  return renderHook(() => useLookupSelection(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    ),
  })
}

describe("useLookupSelection's rank range", () => {
  it("auto-advances 'to' to 'from' + 1 when only 'from' changes", () => {
    const { result } = renderSelection()

    act(() => {
      result.current.setDraftRange("Bronze1", result.current.draft.rankEnd)
    })

    expect(result.current.draft.rankStart).toBe("Bronze1")
    expect(result.current.draft.rankEnd).toBe("Bronze2")
  })

  it("leaves 'to' alone when it was set explicitly (both values change together)", () => {
    const { result } = renderSelection()

    act(() => {
      result.current.setDraftRange("Bronze1", "Gold1")
    })

    expect(result.current.draft.rankStart).toBe("Bronze1")
    expect(result.current.draft.rankEnd).toBe("Gold1")
  })

  // No "clamps Adamantine3 down to Adamantine2" cases here for now: Adamantine3 is currently removed
  // from the Rank ladder entirely (see rank.ts's lastRank comment), so there's no longer a rank value
  // beyond the ceiling to clamp — `clampToCurrentMax`/lastRank-capping in useLookupSelection is a
  // no-op today, kept so this file needs no changes once Adamantine3 ships. Reinstate cases like
  // these (an out-of-range rank via setDraftRange, and via the URL) at that point.

  it("ignores an unrecognized rank supplied via the URL and falls back to the default", () => {
    const { result } = renderSelection(
      "/?rankStart=Adamantine2&rankEnd=NotARealRank"
    )

    expect(result.current.applied.rankStart).toBe("Adamantine2")
    expect(result.current.applied.rankEnd).toBe("Stone2")
  })
})
