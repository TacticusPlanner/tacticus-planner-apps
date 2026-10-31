import { afterEach, describe, expect, it, vi } from "vitest"

import { migrateLegacyAccountKeys, safeStorage } from "./safe-storage"

describe("safeStorage", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("reads, writes and removes through localStorage", () => {
    safeStorage.set("k", "v")
    expect(safeStorage.get("k")).toBe("v")
    safeStorage.remove("k")
    expect(safeStorage.get("k")).toBeNull()
  })

  it("returns null and never throws when storage is blocked", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError")
    }
    vi.stubGlobal("localStorage", {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    })

    expect(safeStorage.get("k")).toBeNull()
    expect(() => safeStorage.set("k", "v")).not.toThrow()
    expect(() => safeStorage.remove("k")).not.toThrow()
  })
})

describe("migrateLegacyAccountKeys", () => {
  afterEach(() => {
    localStorage.clear()
  })

  it("moves dailies progress under the account prefix, so sign-out removes it", () => {
    localStorage.setItem("tp.dailies.hse.progress.v2", '{"a":1}')
    localStorage.setItem("tp.dailies.quest.progress.v1", '{"q":1}')
    localStorage.setItem("theme", "dark")

    migrateLegacyAccountKeys()

    expect(localStorage.getItem("tp.session.dailies.hse.progress.v2")).toBe(
      '{"a":1}'
    )
    expect(localStorage.getItem("tp.session.dailies.quest.progress.v1")).toBe(
      '{"q":1}'
    )
    expect(localStorage.getItem("tp.dailies.hse.progress.v2")).toBeNull()
    expect(localStorage.getItem("tp.dailies.quest.progress.v1")).toBeNull()
    expect(localStorage.getItem("theme")).toBe("dark")
  })

  it("keeps a value already at the new key and still drops the legacy one", () => {
    localStorage.setItem("tp.dailies.hre.progress.v1", "old")
    localStorage.setItem("tp.session.dailies.hre.progress.v1", "new")

    migrateLegacyAccountKeys()

    expect(localStorage.getItem("tp.session.dailies.hre.progress.v1")).toBe(
      "new"
    )
    expect(localStorage.getItem("tp.dailies.hre.progress.v1")).toBeNull()
  })
})
