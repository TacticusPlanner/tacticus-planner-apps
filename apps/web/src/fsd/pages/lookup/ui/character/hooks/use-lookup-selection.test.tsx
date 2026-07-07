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

  it("caps the range at Adamantine2 instead of the ladder's absolute max (Adamantine3)", () => {
    const { result } = renderSelection()

    act(() => {
      result.current.setDraftRange("Adamantine3", result.current.draft.rankEnd)
    })

    // "from" itself is clamped down to the practical ceiling...
    expect(result.current.draft.rankStart).toBe("Adamantine2")
    // ...and since there's no valid "one rank up" left from there, "to" just stays put instead of
    // overshooting past the ceiling.
    expect(result.current.draft.rankEnd).toBe("Adamantine2")
  })

  it("clamps an out-of-range rank supplied via the URL down to the practical ceiling", () => {
    const { result } = renderSelection(
      "/?rankStart=Adamantine2&rankEnd=Adamantine3"
    )

    expect(result.current.applied.rankEnd).toBe("Adamantine2")
  })
})
