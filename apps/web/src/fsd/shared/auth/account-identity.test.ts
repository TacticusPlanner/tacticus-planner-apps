import type { AccountInfo } from "@azure/msal-browser"
import { describe, expect, it } from "vitest"

import {
  getAccountEmail,
  getAccountObjectId,
  getSignInMethod,
} from "./account-identity"

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

  it("is google for a generated username, even without claims or idp", () => {
    const generated =
      "0f8c2c51-6a2e-4b7a-9d3e-1c2b3a4d5e6f@tacticusplannerext.onmicrosoft.com"
    expect(getSignInMethod(account(generated))).toBe("google")
    expect(getSignInMethod(account(generated, {}))).toBe("google")
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

describe("getAccountObjectId", () => {
  it("is the oid claim when the ID token has one", () => {
    expect(
      getAccountObjectId(account("me@example.com", { oid: "oid-from-token" }))
    ).toBe("oid-from-token")
  })

  it("falls back to localAccountId without an ID token or oid", () => {
    expect(getAccountObjectId(account("me@example.com"))).toBe("local")
    expect(getAccountObjectId(account("me@example.com", {}))).toBe("local")
  })
})
