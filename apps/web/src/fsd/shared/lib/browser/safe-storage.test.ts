import { afterEach, describe, expect, it, vi } from "vitest"

import { safeStorage } from "./safe-storage"

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
