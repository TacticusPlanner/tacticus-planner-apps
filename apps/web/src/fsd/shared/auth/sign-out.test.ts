import { beforeEach, describe, expect, it, vi } from "vitest"

import { seedGameCatalog, seedPlayerData } from "@/test/seed"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

const forgetAccountHint = vi.fn()
vi.mock("./authentication", () => ({
  forgetAccountHint: () => forgetAccountHint(),
}))

import { signOut } from "./sign-out"

const databaseNames = async () =>
  (await indexedDB.databases()).map((database) => database.name)

describe("signOut", () => {
  beforeEach(() => {
    forgetAccountHint.mockClear()
  })

  it("deletes both IndexedDB databases before redirecting", async () => {
    await seedGameCatalog({ characters: [{ id: "ultraCalgar" }] })
    await seedPlayerData({ characters: [{ unitId: "ultraCalgar" }] })
    expect(await databaseNames()).toEqual(
      expect.arrayContaining([
        "tacticus-planner-game-catalog",
        "tacticus-planner-player-data",
      ])
    )

    const account = { homeAccountId: "account-1" }
    let databasesAtRedirect: (string | undefined)[] = []
    const logoutRedirect = vi.fn(async () => {
      databasesAtRedirect = await databaseNames()
    })
    const instance = { getAllAccounts: () => [account], logoutRedirect }

    await signOut(instance as never, account.homeAccountId)

    expect(logoutRedirect).toHaveBeenCalledWith({ account })
    expect(databasesAtRedirect).not.toContain("tacticus-planner-game-catalog")
    expect(databasesAtRedirect).not.toContain("tacticus-planner-player-data")
  })

  it("removes the device's account hint before redirecting", async () => {
    const logoutRedirect = vi.fn().mockResolvedValue(undefined)
    const instance = { getAllAccounts: () => [], logoutRedirect }

    await signOut(instance as never, "account-1")

    expect(forgetAccountHint).toHaveBeenCalledOnce()
    expect(forgetAccountHint.mock.invocationCallOrder[0]).toBeLessThan(
      at(logoutRedirect.mock.invocationCallOrder, 0)
    )
  })
})
