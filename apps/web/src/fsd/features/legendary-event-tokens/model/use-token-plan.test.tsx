import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { workedViewInput } from "../lib/token-plan-view.fixtures"
import { useTokenPlan } from "./use-token-plan"

describe("useTokenPlan", () => {
  it("is loading until the event and its lifecycle are known", () => {
    const { result } = renderHook(() =>
      useTokenPlan({
        ...workedViewInput(),
        event: undefined,
        lifecycle: undefined,
      })
    )

    expect(result.current).toEqual({ kind: "loading" })
  })

  it("plans the worked example and keeps the result across renders with an equal lifecycle", () => {
    const input = workedViewInput()
    const { result, rerender } = renderHook(
      ({ lifecycle }) => useTokenPlan({ ...input, lifecycle }),
      { initialProps: { lifecycle: { ...input.lifecycle } } }
    )
    const first = result.current
    expect(first.kind === "ready" && first.plan.totalPoints).toBe(1136)

    rerender({ lifecycle: { ...input.lifecycle } })
    expect(result.current).toBe(first)
  })

  it("re-plans when the plan's data changes", () => {
    const input = workedViewInput()
    const { result, rerender } = renderHook(
      ({ plan }) => useTokenPlan({ ...input, plan }),
      { initialProps: { plan: input.plan } }
    )

    rerender({ plan: { enabled: true, status: "error", data: undefined } })
    expect(result.current.kind).toBe("planError")
  })
})
