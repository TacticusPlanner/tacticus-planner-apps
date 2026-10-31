import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { isBetaPromoActive, useBetaPromo } from "./beta-promo"

describe("beta promo", () => {
  afterEach(() => window.localStorage.clear())

  it("is active through 7 November and gone on 8 November", () => {
    expect(isBetaPromoActive(new Date(2026, 10, 7, 23, 59))).toBe(true)
    expect(isBetaPromoActive(new Date(2026, 10, 8))).toBe(false)
  })

  it("stays hidden on this device once dismissed", () => {
    const now = new Date(2026, 10, 1)
    const { result } = renderHook(() => useBetaPromo(now))
    expect(result.current.show).toBe(true)

    act(() => result.current.dismiss())
    expect(result.current.show).toBe(false)
    expect(renderHook(() => useBetaPromo(now)).result.current.show).toBe(false)
  })
})
