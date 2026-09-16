export type CurrentUser = {
  applicationUserId: string
  displayName: string
  hasCompletedOnboarding: boolean
  tacticusApiKeyMasked: string | null
  tacticusUserIdMasked: string | null
  // Pseudonymous id the API derives for this account - the identity reported to the analytics
  // destination, never the raw applicationUserId. See specs/product-analytics/spec.md.
  analyticsId: string
}
