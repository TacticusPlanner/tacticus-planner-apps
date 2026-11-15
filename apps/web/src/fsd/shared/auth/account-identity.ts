import type { AccountInfo } from "@azure/msal-browser"

export type SignInMethod = "google" | "email"

// Entra names a federated user `<object id>@<tenant domain>`; a local account's username is the
// address they typed.
const GENERATED_USERNAME = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}@/i

/** Whether the username is one Entra generated for a federated (Google) user. */
export function isGeneratedUsername(username: string): boolean {
  return GENERATED_USERNAME.test(username)
}

/**
 * Entra adds `idp` to the ID token only when an outside provider signed the user in; local email
 * accounts carry none. The claims alone are not enough: a cached account can come back without an
 * ID token, or with one that has no `idp` (production auth_step data, Nov 2026: Google accounts
 * read as email on one load and as Google on the next), so the generated username settles it.
 */
export function getSignInMethod(account: AccountInfo): SignInMethod {
  return account.idTokenClaims?.idp === "google.com" ||
    isGeneratedUsername(account.username)
    ? "google"
    : "email"
}

/**
 * The address to show for the account, or null when the token has none. A Google user's `username`
 * (`preferred_username`) is a generated `<oid>@<tenant>.onmicrosoft.com`, so it only stands in for local accounts;
 * the `email` optional claim wins whenever the app registration emits it.
 */
export function getAccountEmail(account: AccountInfo): string | null {
  const email = account.idTokenClaims?.email
  if (typeof email === "string" && email !== "") return email
  return getSignInMethod(account) === "email" ? account.username : null
}
