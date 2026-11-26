import { afterEach, describe, expect, it, vi } from "vitest"

import {
  LAST_OPENED_UPDATE_KEY,
  changelogTarget,
  fetchLatestUpdateId,
  resolveChangelogTarget,
} from "./userjot-latest-update"

const storage = new Map<string, string>()
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => void storage.set(key, value),
})

function feed(body: unknown, ok = true) {
  return vi.fn<typeof fetch>(
    async () => ({ ok, json: async () => body }) as Response
  )
}

afterEach(() => {
  storage.clear()
})

describe("fetchLatestUpdateId", () => {
  it("asks the widget feed for one post and returns its id", async () => {
    const fetchImpl = feed({ items: [{ id: "upd_1", title: "v2.6.0" }] })

    await expect(fetchLatestUpdateId("proj", fetchImpl)).resolves.toBe("upd_1")
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://widget.userjot.com/widget/v2/proj/updates?limit=1",
      expect.objectContaining({ credentials: "omit" })
    )
  })

  it.each([
    ["an empty feed", { items: [] }],
    ["an unexpected shape", { data: [{ id: "upd_1" }] }],
    ["a non-string id", { items: [{ id: 42 }] }],
  ])("returns null for %s", async (_, body) => {
    await expect(fetchLatestUpdateId("proj", feed(body))).resolves.toBeNull()
  })

  it("returns null for an error response", async () => {
    await expect(
      fetchLatestUpdateId("proj", feed({ items: [{ id: "upd_1" }] }, false))
    ).resolves.toBeNull()
  })
})

describe("changelogTarget", () => {
  it("opens the newest post when it is unread and not the last one opened", () => {
    expect(changelogTarget(true, "upd_2", "upd_1")).toEqual({
      to: "updates",
      updateId: "upd_2",
    })
  })

  it("opens Home without unread activity", () => {
    expect(changelogTarget(false, "upd_2", null)).toEqual({ to: "home" })
  })

  it.each([
    ["an unknown newest post", true, null, null],
    ["the newest post already opened from here", true, "upd_2", "upd_2"],
  ])("opens the Updates list with %s", (_, hasUnread, latest, lastOpened) => {
    expect(changelogTarget(hasUnread, latest, lastOpened)).toEqual({
      to: "updates",
    })
  })
})

describe("resolveChangelogTarget", () => {
  it("opens Home without asking the feed when nothing is unread", async () => {
    const fetchImpl = feed({ items: [{ id: "upd_1" }] })

    await expect(
      resolveChangelogTarget(false, "proj", fetchImpl)
    ).resolves.toEqual({
      to: "home",
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("opens the newest post once, then the list while the dot stays lit", async () => {
    const fetchImpl = feed({ items: [{ id: "upd_1" }] })

    await expect(
      resolveChangelogTarget(true, "proj", fetchImpl)
    ).resolves.toEqual({
      to: "updates",
      updateId: "upd_1",
    })
    expect(storage.get(LAST_OPENED_UPDATE_KEY)).toBe("upd_1")
    await expect(
      resolveChangelogTarget(true, "proj", fetchImpl)
    ).resolves.toEqual({
      to: "updates",
    })
  })

  it("falls back to the list when the feed cannot be reached", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch")
    })

    await expect(
      resolveChangelogTarget(true, "proj", fetchImpl)
    ).resolves.toEqual({
      to: "updates",
    })
  })
})
