import { afterEach, describe, expect, it, vi } from "vitest"

import { shareCurrentLookupUrl } from "./character-lookup-share"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("shareCurrentLookupUrl", () => {
  it("shares via the Web Share sheet when preferred and available", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { ...navigator, share })

    const result = await shareCurrentLookupUrl(true)

    expect(share).toHaveBeenCalledWith({ url: window.location.href })
    expect(result).toBe("shared")
  })

  it("treats the user dismissing the native share sheet as shared, not a failure", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("dismissed", "AbortError"))
    vi.stubGlobal("navigator", { ...navigator, share })

    expect(await shareCurrentLookupUrl(true)).toBe("shared")
  })

  it("falls back to the clipboard when the Web Share sheet fails for another reason", async () => {
    const share = vi.fn().mockRejectedValue(new Error("boom"))
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      clipboard: { writeText },
    })

    expect(await shareCurrentLookupUrl(true)).toBe("copied")
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })

  it("copies to the clipboard directly when Web Share isn't preferred", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", {
      ...navigator,
      share: undefined,
      clipboard: { writeText },
    })

    expect(await shareCurrentLookupUrl(false)).toBe("copied")
  })

  it("reports an error when the clipboard write itself fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"))
    vi.stubGlobal("navigator", {
      ...navigator,
      share: undefined,
      clipboard: { writeText },
    })

    expect(await shareCurrentLookupUrl(false)).toBe("error")
  })
})
