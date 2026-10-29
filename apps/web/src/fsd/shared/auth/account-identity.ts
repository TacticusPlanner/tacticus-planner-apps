import type { AccountInfo } from "@azure/msal-browser"

export type SignInMethod = "google" | "email"

/** Entra adds `idp` to the ID token only when an outside provider signed the user in; local email accounts carry none. */
export function getSignInMethod(account: AccountInfo): SignInMethod {
  return account.idTokenClaims?.idp === "google.com" ? "google" : "email"
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
