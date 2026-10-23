import { describe, expect, it, vi } from "vitest"

import { preloadOnMatch } from "./preload-on-match"

describe("preloadOnMatch", () => {
  it("starts the download and returns null without waiting for it", () => {
    const load = vi.fn(() => new Promise<never>(() => {}))

    expect(preloadOnMatch(load)()).toBeNull()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it("swallows a failed download so the lazy render reports it instead", async () => {
    const loader = preloadOnMatch(() => Promise.reject(new Error("offline")))

    expect(loader()).toBeNull()
    await Promise.resolve()
  })
})
