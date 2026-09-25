import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getCurrentUser = vi.fn()
const updateDisplayName = vi.fn()

vi.mock("../api/account.api", () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  getUserJotToken: vi.fn(),
  updateDisplayName: (...args: unknown[]) => updateDisplayName(...args),
}))

import { accountQueries } from "../api/account.queries"
import { useUpdateDisplayName } from "./use-update-display-name"

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  // The `/me` query must be active for invalidation to refetch it, as it is in the real app.
  const hook = renderHook(
    () => {
      useQuery(accountQueries.current())
      return useUpdateDisplayName()
    },
    { wrapper }
  )
  return hook
}

describe("useUpdateDisplayName", () => {
  beforeEach(() => {
    getCurrentUser.mockReset().mockResolvedValue({ displayName: null })
    updateDisplayName.mockReset().mockResolvedValue({ displayName: "Ada" })
  })

  it("resolves only after /me has been refetched", async () => {
    const { result } = setup()
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(1))
    getCurrentUser.mockResolvedValue({ displayName: "Ada" })

    await act(() => result.current.mutateAsync("Ada"))

    expect(updateDisplayName).toHaveBeenCalledWith("Ada", expect.anything())
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })

  it("rejects when the /me refresh fails, so a save is never reported as complete", async () => {
    const { result } = setup()
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalledTimes(1))
    getCurrentUser.mockRejectedValue(new Error("offline"))

    await expect(act(() => result.current.mutateAsync("Ada"))).rejects.toThrow(
      "offline"
    )
  })
})
