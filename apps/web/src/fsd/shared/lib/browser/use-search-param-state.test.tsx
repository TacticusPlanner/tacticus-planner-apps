import { useLocation, useNavigationType } from "react-router"
import { describe, expect, it } from "vitest"

import { act, renderHook } from "@/test/render"

import { useSearchParamState } from "./use-search-param-state"

const statuses = ["toReach", "paused", "reached"] as const
type Status = (typeof statuses)[number]
const isStatus = (value: string) => statuses.includes(value as Status)

function renderAt(
  entry: string,
  history: "replace" | "push" = "replace",
  isValid: (value: string) => boolean | undefined = isStatus
) {
  return renderHook(
    () => ({
      state: useSearchParamState<Status>("status", isValid, "toReach", {
        history,
      }),
      location: useLocation(),
      navigationType: useNavigationType(),
    }),
    { route: "/plan/goals", initialEntries: [entry] }
  )
}

describe("useSearchParamState", () => {
  it("reads a valid value", () => {
    const { result } = renderAt("/plan/goals?status=paused")
    expect(result.current.state[0]).toBe("paused")
  })

  it("falls back when the param is missing", () => {
    const { result } = renderAt("/plan/goals")
    expect(result.current.state[0]).toBe("toReach")
  })

  it("removes an invalid value with replace", () => {
    const { result } = renderAt("/plan/goals?status=bogus&project=p1")
    expect(result.current.state[0]).toBe("toReach")
    expect(result.current.location.search).toBe("?project=p1")
    expect(result.current.navigationType).toBe("REPLACE")
  })

  it("keeps an undecidable value in the URL but returns the fallback", () => {
    const { result } = renderAt(
      "/plan/goals?status=g1",
      "push",
      () => undefined
    )
    expect(result.current.state[0]).toBe("toReach")
    expect(result.current.location.search).toBe("?status=g1")
  })

  it("deletes the param when set to the fallback", () => {
    const { result } = renderAt("/plan/goals?status=paused")
    act(() => result.current.state[1]("toReach"))
    expect(result.current.location.search).toBe("")
  })

  it("replaces the entry by default and pushes one with history push", () => {
    const replaced = renderAt("/plan/goals")
    act(() => replaced.result.current.state[1]("paused"))
    expect(replaced.result.current.navigationType).toBe("REPLACE")
    expect(replaced.result.current.location.search).toBe("?status=paused")

    const pushed = renderAt("/plan/goals", "push")
    act(() =>
      pushed.result.current.state[1]("reached", { state: { mine: true } })
    )
    expect(pushed.result.current.navigationType).toBe("PUSH")
    expect(pushed.result.current.location.state).toEqual({ mine: true })
  })
})
