import { beforeEach, describe, expect, it, vi } from "vitest"

const deleteGameCatalogDb = vi.fn().mockResolvedValue(undefined)
const deletePlayerDataDb = vi.fn().mockResolvedValue(undefined)

vi.mock("@workspace/game-catalog", () => ({
  deleteGameCatalogDb: () => deleteGameCatalogDb(),
}))

vi.mock("@workspace/player-data", () => ({
  deletePlayerDataDb: () => deletePlayerDataDb(),
}))

const forgetAccountHint = vi.fn()
vi.mock("./authentication", () => ({
  forgetAccountHint: () => forgetAccountHint(),
}))

import { signOut } from "./sign-out"

describe("signOut", () => {
  beforeEach(() => {
    deleteGameCatalogDb.mockClear()
    deletePlayerDataDb.mockClear()
    forgetAccountHint.mockClear()
  })

  it("deletes both IndexedDB databases before redirecting", async () => {
    const account = { homeAccountId: "account-1" }
    const logoutRedirect = vi.fn().mockResolvedValue(undefined)
    const instance = { getAllAccounts: () => [account], logoutRedirect }

    await signOut(instance as never, account.homeAccountId)

    expect(deleteGameCatalogDb).toHaveBeenCalledTimes(1)
    expect(deletePlayerDataDb).toHaveBeenCalledTimes(1)
    expect(logoutRedirect).toHaveBeenCalledWith({ account })
    expect(deleteGameCatalogDb.mock.invocationCallOrder[0]).toBeLessThan(
      logoutRedirect.mock.invocationCallOrder[0]
    )
    expect(deletePlayerDataDb.mock.invocationCallOrder[0]).toBeLessThan(
      logoutRedirect.mock.invocationCallOrder[0]
    )
  })

  it("removes the device's account hint before redirecting", async () => {
    const logoutRedirect = vi.fn().mockResolvedValue(undefined)
    const instance = { getAllAccounts: () => [], logoutRedirect }

    await signOut(instance as never, "account-1")

    expect(forgetAccountHint).toHaveBeenCalledOnce()
    expect(forgetAccountHint.mock.invocationCallOrder[0]).toBeLessThan(
      logoutRedirect.mock.invocationCallOrder[0]
    )
  })
})
