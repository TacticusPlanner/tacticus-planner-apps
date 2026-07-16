import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const msal = vi.hoisted(() => ({
  accounts: [{ homeAccountId: "fallback-account" }],
  activeAccount: { homeAccountId: "active-account" } as {
    homeAccountId: string
  } | null,
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: msal.accounts,
    instance: { getActiveAccount: () => msal.activeAccount },
  }),
}))

import { useActiveAccountId } from "./use-active-account-id"

describe("useActiveAccountId", () => {
  beforeEach(() => {
    msal.activeAccount = { homeAccountId: "active-account" }
  })

  it("uses the active MSAL account", () => {
    expect(renderHook(() => useActiveAccountId()).result.current).toBe(
      "active-account"
    )
  })

  it("falls back to the first known account", () => {
    msal.activeAccount = null

    expect(renderHook(() => useActiveAccountId()).result.current).toBe(
      "fallback-account"
    )
  })
})
