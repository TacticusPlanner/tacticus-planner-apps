import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const isInteractionRequired = vi.hoisted(() => vi.fn<(e: unknown) => boolean>())
const requestApiAccess = vi.hoisted(() => vi.fn<() => Promise<void>>())

vi.mock("./authentication", () => ({
  isInteractionRequired: (error: unknown) => isInteractionRequired(error),
  requestApiAccess: () => requestApiAccess(),
}))

import { useRequestApiAccessOnce } from "./use-request-api-access-once"

const flush = () => act(async () => {})

describe("useRequestApiAccessOnce", () => {
  beforeEach(() => {
    isInteractionRequired.mockReset().mockReturnValue(false)
    requestApiAccess.mockReset().mockResolvedValue(undefined)
  })

  it("does nothing for an absent or ordinary error", async () => {
    const onError = vi.fn()
    const { result, rerender } = renderHook(
      ({ error }: { error: unknown }) =>
        useRequestApiAccessOnce(error, onError),
      { initialProps: { error: undefined } }
    )
    expect(result.current).toBe(false)
    rerender({ error: new Error("boom") })
    await flush()
    expect(result.current).toBe(false)
    expect(requestApiAccess).not.toHaveBeenCalled()
  })

  it("requests API access once per interaction-required error and reports handling", async () => {
    const error = new Error("interaction_required")
    isInteractionRequired.mockImplementation((e) => e === error)
    const onError = vi.fn()
    const { result, rerender } = renderHook(
      ({ error }: { error: unknown }) =>
        useRequestApiAccessOnce(error, onError),
      { initialProps: { error } }
    )
    await flush()
    expect(result.current).toBe(true)
    rerender({ error })
    await flush()
    expect(requestApiAccess).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
  })

  it("shares one in-flight request between two mounted instances", async () => {
    const error = new Error("interaction_required")
    isInteractionRequired.mockImplementation((e) => e === error)
    let resolveRedirect: () => void = () => {}
    requestApiAccess.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRedirect = resolve
      })
    )
    const onError = vi.fn()

    renderHook(() => useRequestApiAccessOnce(error, onError))
    renderHook(() => useRequestApiAccessOnce(error, onError))
    await flush()

    expect(requestApiAccess).toHaveBeenCalledTimes(1)
    resolveRedirect()
    await flush()
    expect(onError).not.toHaveBeenCalled()
  })

  it("surfaces a failed request to every subscriber", async () => {
    const error = new Error("interaction_required")
    isInteractionRequired.mockImplementation((e) => e === error)
    const failure = new Error("interaction_in_progress")
    requestApiAccess.mockRejectedValue(failure)
    const onError = vi.fn()

    renderHook(() => useRequestApiAccessOnce(error, onError))
    await flush()

    expect(onError).toHaveBeenCalledWith(failure)
  })
})
