// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import { safeSessionStorage, safeStorage } from "./safe-storage"
import { sessionStorageKeys, storageKeys } from "./storage-keys"

const key = storageKeys.featureFlags
const sessionKey = sessionStorageKeys.authTabId
const blocked = () => {
  throw new DOMException("blocked", "SecurityError")
}

describe("safeStorage", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    sessionStorage.clear()
  })

  it("reads, writes and removes through localStorage", () => {
    safeStorage.set(key, "v")
    expect(localStorage.getItem(key)).toBe("v")
    expect(safeStorage.get(key)).toBe("v")
    safeStorage.remove(key)
    expect(safeStorage.get(key)).toBeNull()
  })

  it("reads, writes and removes through sessionStorage", () => {
    safeSessionStorage.set(sessionKey, "v")
    expect(sessionStorage.getItem(sessionKey)).toBe("v")
    expect(localStorage.getItem(sessionKey)).toBeNull()
    safeSessionStorage.remove(sessionKey)
    expect(safeSessionStorage.get(sessionKey)).toBeNull()
  })

  it("removes only the keys under a prefix", () => {
    localStorage.setItem(storageKeys.userOwner, "a")
    localStorage.setItem(storageKeys.userHseProgress, "{}")
    localStorage.setItem(storageKeys.theme, "dark")

    safeStorage.removeByPrefix("tp.user.")

    expect(Object.keys(localStorage)).toEqual([storageKeys.theme])
  })

  it("returns null, reports failed writes and never throws when storage is blocked", () => {
    const storage = {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    }
    vi.stubGlobal("localStorage", storage)
    vi.stubGlobal("sessionStorage", storage)

    expect(safeStorage.get(key)).toBeNull()
    expect(() => safeStorage.set(key, "v")).not.toThrow()
    expect(safeStorage.trySet(key, "v")).toBe(false)
    expect(() => safeStorage.remove(key)).not.toThrow()
    expect(() => safeStorage.removeByPrefix("tp.user.")).not.toThrow()
    expect(safeSessionStorage.get(sessionKey)).toBeNull()
    expect(safeSessionStorage.trySet(sessionKey, "v")).toBe(false)
  })
})
