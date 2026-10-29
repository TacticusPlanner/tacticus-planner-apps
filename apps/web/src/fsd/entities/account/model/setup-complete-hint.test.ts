import { afterEach, describe, expect, it } from "vitest"

import type { CurrentUser } from "./current-user"
import {
  clearSetupCompleteHint,
  readSetupCompleteHint,
  rememberSetupState,
} from "./setup-complete-hint"

const completeUser: CurrentUser = {
  applicationUserId: "user-1",
  displayName: "Test User",
  suggestedDisplayName: null,
  hasCompletedOnboarding: true,
  tacticusApiKeyMasked: "••••abcd",
  tacticusUserIdMasked: null,
  analyticsId: "analytics-1",
}

describe("setup-complete hint", () => {
  afterEach(() => {
    localStorage.clear()
  })

  it("remembers only the account that finished setup", () => {
    rememberSetupState("account-a", completeUser)

    expect(readSetupCompleteHint("account-a")).toBe(true)
    expect(readSetupCompleteHint("account-b")).toBe(false)
    expect(readSetupCompleteHint(undefined)).toBe(false)
  })

  it("drops the hint when the account's setup is no longer complete", () => {
    rememberSetupState("account-a", completeUser)
    rememberSetupState("account-a", { ...completeUser, displayName: null })

    expect(readSetupCompleteHint("account-a")).toBe(false)
  })

  it("keeps another account's hint when a different account is unconfigured", () => {
    rememberSetupState("account-a", completeUser)
    rememberSetupState("account-b", {
      ...completeUser,
      hasCompletedOnboarding: false,
    })

    expect(readSetupCompleteHint("account-a")).toBe(true)
  })

  it("forgets the hint once cleared", () => {
    rememberSetupState("account-a", completeUser)
    clearSetupCompleteHint()

    expect(readSetupCompleteHint("account-a")).toBe(false)
  })

  it("stores no account details", () => {
    rememberSetupState("account-a", completeUser)

    expect(Object.values({ ...localStorage })).toEqual(["account-a"])
  })
})
