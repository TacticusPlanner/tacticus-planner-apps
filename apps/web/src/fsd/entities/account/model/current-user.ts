export type CurrentUser = {
  applicationUserId: string
  // The name the user chose, or null until they set one. Never a provider/email-like value —
  // that only ever arrives as `suggestedDisplayName`.
  displayName: string | null
  // Private, editable prefill for the name step. Must not be shown as identity anywhere else.
  suggestedDisplayName: string | null
  hasCompletedOnboarding: boolean
  tacticusApiKeyMasked: string | null
  tacticusUserIdMasked: string | null
  // Pseudonymous id the API derives for this account - the identity reported to the analytics
  // destination, never the raw applicationUserId. See specs/product-analytics/spec.md.
  analyticsId: string
}

/** Setup is finished only once the account has both a Tacticus key and a chosen name. */
export function isAccountSetupComplete(user: CurrentUser) {
  return user.hasCompletedOnboarding && user.displayName !== null
}
