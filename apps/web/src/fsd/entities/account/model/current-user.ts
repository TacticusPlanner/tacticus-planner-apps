export type CurrentUser = {
  applicationUserId: string
  displayName: string
  hasCompletedOnboarding: boolean
  tacticusApiKeyMasked: string | null
  tacticusUserIdMasked: string | null
}
