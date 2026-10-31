import { beforeEach, describe, expect, it } from "vitest"

import { getPlayerDataMetadata } from "@workspace/player-data"

import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { claimAccountLocalData } from "./account-local-data"

const OWNER_KEY = "tp.session.owner"

const storedChunkKeys = async () => [...(await getPlayerDataMetadata()).keys()]

const databaseNames = async () =>
  (await indexedDB.databases()).map((database) => database.name)

describe("claimAccountLocalData", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("drops a local copy left by a different account, and keeps the public catalog", async () => {
    await seedGameCatalog({ characters: [{ id: "ultraCalgar" }] })
    await seedPlayerData({ characters: [{ unitId: "ultraCalgar" }] })
    localStorage.setItem(OWNER_KEY, "account-a")
    localStorage.setItem("tp.session.dailies.quest.progress.v1", "{}")
    localStorage.setItem("theme", "dark")

    await claimAccountLocalData("account-b")

    expect(await storedChunkKeys()).toEqual([])
    expect(await databaseNames()).toContain("tacticus-planner-game-catalog")
    expect(
      localStorage.getItem("tp.session.dailies.quest.progress.v1")
    ).toBeNull()
    expect(localStorage.getItem("theme")).toBe("dark")
    expect(localStorage.getItem(OWNER_KEY)).toBe("account-b")
  })

  it("keeps the copy of the account that owns it", async () => {
    await seedPlayerData({ characters: [{ unitId: "ultraCalgar" }] })
    localStorage.setItem(OWNER_KEY, "account-a")
    localStorage.setItem("tp.session.dailies.quest.progress.v1", "{}")

    await claimAccountLocalData("account-a")

    expect(await storedChunkKeys()).toContain("characters")
    expect(localStorage.getItem("tp.session.dailies.quest.progress.v1")).toBe(
      "{}"
    )
  })

  it("adopts a copy that predates the owner record instead of deleting it", async () => {
    await seedPlayerData({ characters: [{ unitId: "ultraCalgar" }] })

    await claimAccountLocalData("account-a")

    expect(await storedChunkKeys()).toContain("characters")
    expect(localStorage.getItem(OWNER_KEY)).toBe("account-a")
  })

  it("does nothing while signed out", async () => {
    await seedPlayerData({ characters: [{ unitId: "ultraCalgar" }] })
    localStorage.setItem(OWNER_KEY, "account-a")

    await claimAccountLocalData(undefined)

    expect(await storedChunkKeys()).toContain("characters")
    expect(localStorage.getItem(OWNER_KEY)).toBe("account-a")
  })
})
