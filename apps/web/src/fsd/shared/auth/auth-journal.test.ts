// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  authErrorCode,
  forgetAuthJournal,
  markRedirectPending,
  recordAuthStep,
  takeAuthJournal,
  takePendingRedirect,
} from "./auth-journal"

describe("auth journal", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.useRealTimers()
  })

  it("hands back the recorded steps once, oldest first, dated and grouped by page load", () => {
    recordAuthStep({ step: "restore_cache", outcome: "failed" })
    recordAuthStep({ step: "quiet_renewal_started", from: "hint" })

    const entries = takeAuthJournal()

    expect(entries.map((entry) => entry.step)).toEqual([
      "restore_cache",
      "quiet_renewal_started",
    ])
    expect(entries[0]?.load).toBe(entries[1]?.load)
    expect(entries[0]?.at).toBeTypeOf("number")
    expect(takeAuthJournal()).toEqual([])
  })

  it("keeps the latest 60 steps of the last 7 days", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-11-01T00:00:00Z"))
    recordAuthStep({ step: "quiet_renewal_skipped", reason: "cooldown" })
    vi.setSystemTime(new Date("2026-11-10T00:00:00Z"))
    for (let index = 0; index < 70; index++) {
      recordAuthStep({ step: "restore_cache", outcome: "success" })
    }

    const entries = takeAuthJournal()

    expect(entries).toHaveLength(60)
    expect(entries.every((entry) => entry.step === "restore_cache")).toBe(true)
  })

  it("reads unreadable storage as empty", () => {
    localStorage.setItem("tp.auth.journal", "{not json")

    expect(takeAuthJournal()).toEqual([])
  })

  it("remembers which redirect left the page, once", () => {
    markRedirectPending("quiet")

    expect(takePendingRedirect()).toBe("quiet")
    expect(takePendingRedirect()).toBeNull()
  })

  it("keeps the redirect marker to this tab", () => {
    markRedirectPending("quiet")

    expect(sessionStorage.getItem("tp.auth.pendingRedirect")).toBe("quiet")
    expect(localStorage.getItem("tp.auth.pendingRedirect")).toBeNull()
  })

  it("ignores the device-wide marker earlier versions wrote (the startup migration deletes it)", () => {
    localStorage.setItem("tp.auth.pendingRedirect", "interactive")

    expect(takePendingRedirect()).toBeNull()
  })

  it("forgets everything on demand", () => {
    recordAuthStep({ step: "restore_cache", outcome: "success" })
    markRedirectPending("interactive")

    forgetAuthJournal()

    expect(takeAuthJournal()).toEqual([])
    expect(takePendingRedirect()).toBeNull()
  })

  it("keeps an error's name only when it is not an MSAL error", () => {
    expect(authErrorCode(new TypeError("secret message"))).toBe("TypeError")
    expect(authErrorCode("nope")).toBeUndefined()
  })
})
