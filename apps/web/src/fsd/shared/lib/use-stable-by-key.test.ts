// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useStableByKey } from "./use-stable-by-key"

describe("useStableByKey", () => {
  it("keeps the first value while the key is unchanged", () => {
    const first = ["a"]
    const { result, rerender } = renderHook(
      ({ key, value }) => useStableByKey(key, value),
      { initialProps: { key: "a", value: first } }
    )
    rerender({ key: "a", value: ["a"] })
    expect(result.current).toBe(first)
  })

  it("takes the new value when the key changes", () => {
    const { result, rerender } = renderHook(
      ({ key, value }) => useStableByKey(key, value),
      { initialProps: { key: "a", value: ["a"] } }
    )
    const next = ["b"]
    rerender({ key: "b", value: next })
    expect(result.current).toBe(next)
  })
})
