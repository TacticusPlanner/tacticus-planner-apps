import type { AccountInfo } from "@azure/msal-browser"
import { describe, expect, it } from "vitest"

import { getAccountEmail, getSignInMethod } from "./account-identity"

function account(
  username: string,
  idTokenClaims?: AccountInfo["idTokenClaims"]
): AccountInfo {
  return {
    homeAccountId: "home",
    environment: "login",
    tenantId: "tenant",
    username,
    localAccountId: "local",
    idTokenClaims,
  }
}

const GENERATED_UPN = "e9118cad@tacticusplannerext.onmicrosoft.com"

describe("getSignInMethod", () => {
  it("is google when the token names google.com as the identity provider", () => {
    expect(getSignInMethod(account(GENERATED_UPN, { idp: "google.com" }))).toBe(
      "google"
    )
  })

  it("is email when the token has no idp", () => {
    expect(getSignInMethod(account("me@example.com", {}))).toBe("email")
    expect(getSignInMethod(account("me@example.com"))).toBe("email")
  })
})

describe("getAccountEmail", () => {
  it("prefers the email claim", () => {
    expect(
      getAccountEmail(
        account(GENERATED_UPN, { idp: "google.com", email: "me@gmail.com" })
      )
    ).toBe("me@gmail.com")
  })

  it("falls back to the username for a local account", () => {
    expect(getAccountEmail(account("me@example.com", {}))).toBe(
      "me@example.com"
    )
  })

  it("never shows a Google user's generated username", () => {
    expect(getAccountEmail(account(GENERATED_UPN, { idp: "google.com" }))).toBe(
      null
    )
  })
})
