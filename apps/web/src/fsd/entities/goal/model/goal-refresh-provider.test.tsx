import { useEffect } from "react"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { GoalRefreshProvider } from "./goal-refresh-provider"
import { useGoalRefresh } from "./goal-refresh-context"

describe("GoalRefreshProvider", () => {
  it("awaits every mounted refetch subscriber before resolving", async () => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const first = vi.fn(() => pending)
    const second = vi.fn(async () => undefined)
    const { result } = renderHook(
      () => {
        const refresh = useGoalRefresh()
        const { registerGoalRefetch } = refresh
        useEffect(
          () => registerGoalRefetch("first", first),
          [registerGoalRefetch]
        )
        useEffect(
          () => registerGoalRefetch("second", second),
          [registerGoalRefetch]
        )
        return refresh
      },
      { wrapper: GoalRefreshProvider }
    )

    let settled = false
    const refreshing = result.current.refreshGoals().then(() => {
      settled = true
    })
    await act(async () => Promise.resolve())
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
    expect(settled).toBe(false)

    release()
    await act(async () => refreshing)
    expect(settled).toBe(true)
  })
})
