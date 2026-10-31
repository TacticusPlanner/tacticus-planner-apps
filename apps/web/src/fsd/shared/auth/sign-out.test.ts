import { beforeEach, describe, expect, it, vi } from "vitest"

import { seedGameCatalog, seedPlayerData } from "@/test/seed"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

const forgetAccountHint = vi.fn()
const forgetFreshLogin = vi.fn()
vi.mock("./authentication", () => ({
  forgetAccountHint: () => forgetAccountHint(),
  forgetFreshLogin: () => forgetFreshLogin(),
}))

import { signOut } from "./sign-out"

const databaseNames = async () =>
  (await indexedDB.databases()).map((database) => database.name)

describe("signOut", () => {
  beforeEach(() => {
    forgetAccountHint.mockClear()
    forgetFreshLogin.mockClear()
  })

  it("deletes the player-data database before redirecting, and keeps the public game catalog", async () => {
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
    expect(databasesAtRedirect).toContain("tacticus-planner-game-catalog")
    expect(databasesAtRedirect).not.toContain("tacticus-planner-player-data")
  })

  it("removes the account's own localStorage keys and keeps device preferences", async () => {
    localStorage.setItem("tp.session.v1-import.pending-material-steps", "[]")
    localStorage.setItem("tp.session.dailies.hse.progress.v2", "{}")
    localStorage.setItem("theme", "dark")
    const instance = {
      getAllAccounts: () => [],
      logoutRedirect: vi.fn().mockResolvedValue(undefined),
    }

    await signOut(instance as never, "account-1")

    expect(
      localStorage.getItem("tp.session.v1-import.pending-material-steps")
    ).toBeNull()
    expect(
      localStorage.getItem("tp.session.dailies.hse.progress.v2")
    ).toBeNull()
    expect(localStorage.getItem("theme")).toBe("dark")
  })

  it("disarms the fresh-login prompt before redirecting, so a later account starts clean", async () => {
    const logoutRedirect = vi.fn().mockResolvedValue(undefined)
    const instance = { getAllAccounts: () => [], logoutRedirect }

    await signOut(instance as never, "account-1")

    expect(forgetFreshLogin).toHaveBeenCalledOnce()
    expect(forgetFreshLogin.mock.invocationCallOrder[0]).toBeLessThan(
      at(logoutRedirect.mock.invocationCallOrder, 0)
    )
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
