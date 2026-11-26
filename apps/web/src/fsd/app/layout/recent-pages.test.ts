// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import { storageKeys } from "@/shared/lib"

import {
  readRecentPages,
  recordRecentPage,
  resetRecentPagesForTests,
} from "./recent-pages"

describe("recent pages", () => {
  afterEach(() => {
    localStorage.clear()
    resetRecentPagesForTests()
    vi.restoreAllMocks()
  })

  it("keeps the last four distinct pages, most recent first", () => {
    for (const path of ["/a", "/b", "/c", "/a", "/d", "/e"])
      recordRecentPage(path)

    expect(readRecentPages()).toEqual(["/e", "/d", "/a", "/c"])
    expect(
      JSON.parse(localStorage.getItem(storageKeys.userNavRecentPages) ?? "")
    ).toEqual(["/e", "/d", "/a", "/c"])
  })

  it("reads damaged storage as nothing stored", () => {
    localStorage.setItem(storageKeys.userNavRecentPages, "{not json")
    expect(readRecentPages()).toEqual([])

    localStorage.setItem(storageKeys.userNavRecentPages, JSON.stringify([1, 2]))
    expect(readRecentPages()).toEqual([])
  })

  it("keeps working in memory when storage refuses access", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    recordRecentPage("/a")
    recordRecentPage("/b")

    expect(readRecentPages()).toEqual(["/b", "/a"])
  })
})
