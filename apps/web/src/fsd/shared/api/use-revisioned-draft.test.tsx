import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "./api-client"

import { useRevisionedDraft } from "./use-revisioned-draft"

type Saved = { value: number; revision: number }
type Draft = { value: number }

const queryKey = ["draft-test"] as const
let server: Saved
const fetchSaved = vi.fn(async () => ({ ...server }))
const save = vi.fn<(payload: Saved) => Promise<Saved>>()
const toDraft = (saved: Saved): Draft => ({ value: saved.value })
const toPayload = (draft: Draft, saved: Saved): Saved => ({
  ...draft,
  revision: saved.revision,
})

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    () =>
      useRevisionedDraft({
        query: { queryKey, queryFn: fetchSaved },
        toDraft,
        toPayload,
        save,
      }),
    { wrapper }
  )
  return { ...hook, client }
}

async function loaded() {
  const hook = setup()
  await waitFor(() => expect(hook.result.current.draft).toEqual({ value: 1 }))
  return hook
}

describe("useRevisionedDraft", () => {
  beforeEach(() => {
    server = { value: 1, revision: 3 }
    fetchSaved.mockClear()
    save.mockReset()
  })

  it("is clean until edited", async () => {
    const { result } = await loaded()
    expect(result.current.isDirty).toBe(false)
    act(() => result.current.update((draft) => ({ value: draft.value + 1 })))
    expect(result.current.draft).toEqual({ value: 2 })
    expect(result.current.isDirty).toBe(true)
  })

  it("is clean again after editing back to the saved value", async () => {
    const { result } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    act(() => result.current.update(() => ({ value: 1 })))
    expect(result.current.isDirty).toBe(false)
  })

  it("discards the draft", async () => {
    const { result } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    act(() => result.current.discard())
    expect(result.current.draft).toEqual({ value: 1 })
    expect(result.current.isDirty).toBe(false)
  })

  it("saves with the base revision, writes the response and clears the draft", async () => {
    save.mockResolvedValue({ value: 5, revision: 4 })
    const { result, client } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.save()
    })
    expect(outcome).toBe("saved")
    expect(save).toHaveBeenCalledWith({ value: 5, revision: 3 })
    expect(client.getQueryData(queryKey)).toEqual({ value: 5, revision: 4 })
    expect(result.current.draft).toEqual({ value: 5 })
    expect(result.current.isDirty).toBe(false)
  })

  it("saves against the revision the draft was built on, even after a refetch", async () => {
    save.mockRejectedValue(new ApiError(409, "conflict"))
    const { result, client } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    // Another device saves meanwhile, and a background refetch brings revision 4 in.
    server = { value: 9, revision: 4 }
    await act(async () => {
      await client.refetchQueries({ queryKey })
    })
    await waitFor(() =>
      expect(result.current.query.data).toEqual({ value: 9, revision: 4 })
    )
    expect(result.current.draft).toEqual({ value: 5 })
    await act(async () => {
      await result.current.save()
    })
    expect(save).toHaveBeenCalledWith({ value: 5, revision: 3 })
  })

  it("keeps edits made while a save is in flight", async () => {
    let resolveSave: (saved: Saved) => void = () => {}
    save.mockImplementation(
      () => new Promise<Saved>((resolve) => (resolveSave = resolve))
    )
    const { result, client } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    let pending: Promise<string> | undefined
    act(() => {
      pending = result.current.save()
    })
    await waitFor(() => expect(save).toHaveBeenCalled())
    act(() => result.current.update(() => ({ value: 7 })))
    await act(async () => {
      resolveSave({ value: 5, revision: 4 })
      await pending
    })
    expect(client.getQueryData(queryKey)).toEqual({ value: 5, revision: 4 })
    expect(result.current.draft).toEqual({ value: 7 })
    expect(result.current.isDirty).toBe(true)
    // The kept edits were made on top of revision 4, so saving them must not trip a 409.
    save.mockResolvedValue({ value: 7, revision: 5 })
    await act(async () => {
      await result.current.save()
    })
    expect(save).toHaveBeenLastCalledWith({ value: 7, revision: 4 })
  })

  it("reloads and drops the draft on a 409 conflict", async () => {
    const { result } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    server = { value: 9, revision: 7 }
    save.mockRejectedValue(new ApiError(409, "Revision mismatch"))
    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.save()
    })
    expect(outcome).toBe("conflict")
    await waitFor(() => expect(result.current.draft).toEqual({ value: 9 }))
    expect(result.current.isDirty).toBe(false)
  })

  it("keeps the draft and reports only an outcome on other errors", async () => {
    const { result } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    save.mockRejectedValue(new ApiError(400, "Raw server validation text"))
    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.save()
    })
    expect(outcome).toBe("error")
    expect(result.current.draft).toEqual({ value: 5 })
    expect(result.current.isDirty).toBe(true)
    expect(JSON.stringify(result.current)).not.toContain(
      "Raw server validation text"
    )
  })

  it("reports an error and keeps the draft when the conflict reload fails", async () => {
    const { result } = await loaded()
    act(() => result.current.update(() => ({ value: 5 })))
    save.mockRejectedValue(new ApiError(409, "Revision mismatch"))
    fetchSaved.mockRejectedValueOnce(new Error("offline"))
    let outcome: string | undefined
    await act(async () => {
      outcome = await result.current.save()
    })
    expect(outcome).toBe("error")
    expect(result.current.draft).toEqual({ value: 5 })
  })
})
