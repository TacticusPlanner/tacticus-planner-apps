import { beforeEach, describe, expect, it, vi } from "vitest"

const deleteGameCatalogDb = vi.fn().mockResolvedValue(undefined)
const deletePlayerDataDb = vi.fn().mockResolvedValue(undefined)

vi.mock("@workspace/game-catalog", () => ({
  deleteGameCatalogDb: () => deleteGameCatalogDb(),
}))

vi.mock("@workspace/player-data", () => ({
  deletePlayerDataDb: () => deletePlayerDataDb(),
}))

import { signOut } from "./sign-out"

describe("signOut", () => {
  beforeEach(() => {
    deleteGameCatalogDb.mockClear()
    deletePlayerDataDb.mockClear()
  })

  it("deletes both IndexedDB databases before redirecting", async () => {
    const account = { homeAccountId: "account-1" }
    const logoutRedirect = vi.fn().mockResolvedValue(undefined)
    const instance = { logoutRedirect }

    await signOut(instance as never, account as never)

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
})
