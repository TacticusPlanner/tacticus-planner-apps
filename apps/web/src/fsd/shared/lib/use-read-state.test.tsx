import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"

import { act, render, screen, waitFor } from "@/test/render"

import {
  combineReadStates,
  useReadState,
  type ReadState,
} from "./use-read-state"

function Probe({ read }: { read: () => ReadState<string> }) {
  const state = read()
  return (
    <>
      <p>{state.status === "ready" ? state.data : state.status}</p>
      <button onClick={state.retry}>retry</button>
    </>
  )
}

describe("useReadState", () => {
  it("goes from loading to ready", async () => {
    render(<Probe read={() => useReadState("ok", async () => "value", [])} />)

    expect(screen.getByText("loading")).toBeInTheDocument()
    expect(await screen.findByText("value")).toBeInTheDocument()
  })

  it("reports a failed read as error and re-issues it on retry", async () => {
    const querier = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockRejectedValueOnce(new Error("boom again"))
      .mockResolvedValue("recovered")

    render(<Probe read={() => useReadState("flaky", querier, [])} />)

    // One automatic retry for a transient failure, then the error.
    expect(await screen.findByText("error")).toBeInTheDocument()
    expect(querier).toHaveBeenCalledTimes(2)

    act(() => screen.getByRole("button", { name: "retry" }).click())

    expect(await screen.findByText("recovered")).toBeInTheDocument()
  })
})

describe("combineReadStates", () => {
  const ready = (data: number, retry = vi.fn()): ReadState<number> => ({
    status: "ready",
    data,
    retry,
  })

  it("is ready with every read's data in order", () => {
    expect(combineReadStates(ready(1), ready(2))).toMatchObject({
      status: "ready",
      data: [1, 2],
    })
  })

  it("is loading while any read loads", () => {
    expect(
      combineReadStates(ready(1), { status: "loading", retry: vi.fn() }).status
    ).toBe("loading")
  })

  it("is error when one failed, and retry re-issues only the failed read", () => {
    const okRetry = vi.fn()
    const failedRetry = vi.fn()
    const state = combineReadStates(ready(1, okRetry), {
      status: "error",
      retry: failedRetry,
    })

    expect(state.status).toBe("error")
    state.retry()
    expect(failedRetry).toHaveBeenCalledOnce()
    expect(okRetry).not.toHaveBeenCalled()
  })
})

describe("useReadState after a sync", () => {
  it("refetches when the composite prefix is invalidated", async () => {
    const queryClient = new QueryClient()
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }
    let value = "first"
    render(
      <Probe read={() => useReadState("changing", async () => value, [])} />,
      { wrapper: Wrapper }
    )
    expect(await screen.findByText("first")).toBeInTheDocument()

    value = "second"
    await act(() =>
      queryClient.invalidateQueries({ queryKey: ["local", "composite"] })
    )

    await waitFor(() => expect(screen.getByText("second")).toBeInTheDocument())
  })
})
