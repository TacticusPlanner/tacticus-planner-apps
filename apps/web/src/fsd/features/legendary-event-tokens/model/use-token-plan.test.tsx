import { renderHook } from "@testing-library/react"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"

import { workedViewInput } from "../lib/token-plan-view.fixtures"
import { useTokenPlan } from "./use-token-plan"

let i18n: I18n

describe("useTokenPlan", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("is loading until the event and its lifecycle are known", () => {
    const { result } = renderHook(
      () =>
        useTokenPlan({
          ...workedViewInput(),
          event: undefined,
          lifecycle: undefined,
        }),
      { wrapper: i18nWrapper(i18n) }
    )

    expect(result.current).toEqual({ kind: "loading" })
  })

  it("plans the worked example and keeps the result across renders with an equal lifecycle", () => {
    const input = workedViewInput()
    const { result, rerender } = renderHook(
      ({ lifecycle }) => useTokenPlan({ ...input, lifecycle }),
      {
        initialProps: { lifecycle: { ...input.lifecycle } },
        wrapper: i18nWrapper(i18n),
      }
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
      { initialProps: { plan: input.plan }, wrapper: i18nWrapper(i18n) }
    )

    rerender({ plan: { enabled: true, status: "error", data: undefined } })
    expect(result.current.kind).toBe("planError")
  })
})
