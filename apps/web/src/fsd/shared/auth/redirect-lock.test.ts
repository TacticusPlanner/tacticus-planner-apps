// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  claimRedirectLock,
  REDIRECT_LOCK_SETTLE_MS,
  REDIRECT_LOCK_TTL_MS,
  releaseRedirectLock,
  waitForRedirectLock,
} from "./redirect-lock"

const LOCK_KEY = "tp.auth.redirectLock"

function otherTabLock(at = Date.now()) {
  localStorage.setItem(LOCK_KEY, JSON.stringify({ tab: "other", at }))
}

describe("redirect lock", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function claim() {
    const claimed = claimRedirectLock()
    await vi.advanceTimersByTimeAsync(REDIRECT_LOCK_SETTLE_MS)
    return claimed
  }

  it("lets the first tab claim it, and the same tab claim it again", async () => {
    await expect(claim()).resolves.toBe(true)
    await expect(claim()).resolves.toBe(true)
  })

  it("refuses while another tab holds a live lock", async () => {
    otherTabLock()

    await expect(claim()).resolves.toBe(false)
  })

  it("ignores another tab's lock once its TTL has run out", async () => {
    otherTabLock(Date.now() - REDIRECT_LOCK_TTL_MS)

    await expect(claim()).resolves.toBe(true)
  })

  it("loses to a tab that wrote its claim in the meantime", async () => {
    const claimed = claimRedirectLock()
    otherTabLock()
    await vi.advanceTimersByTimeAsync(REDIRECT_LOCK_SETTLE_MS)

    await expect(claimed).resolves.toBe(false)
  })

  it("releases only its own lock", async () => {
    otherTabLock()
    releaseRedirectLock()
    expect(localStorage.getItem(LOCK_KEY)).not.toBeNull()

    localStorage.clear()
    await claim()
    releaseRedirectLock()
    expect(localStorage.getItem(LOCK_KEY)).toBeNull()
  })

  it("waits until the other tab releases the lock", async () => {
    otherTabLock()
    let released = false
    void waitForRedirectLock().then(() => {
      released = true
    })

    await vi.advanceTimersByTimeAsync(5000)
    expect(released).toBe(false)

    localStorage.removeItem(LOCK_KEY)
    await vi.advanceTimersByTimeAsync(1000)
    expect(released).toBe(true)
  })

  it("stops waiting when the other tab's lock expires", async () => {
    otherTabLock()
    let released = false
    void waitForRedirectLock().then(() => {
      released = true
    })

    await vi.advanceTimersByTimeAsync(REDIRECT_LOCK_TTL_MS + 1000)
    expect(released).toBe(true)
  })
})
