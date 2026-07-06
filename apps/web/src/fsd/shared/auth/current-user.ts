import {
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from "@azure/msal-browser"

import { apiGet } from "@/shared/api"
import { getRequiredEnvironmentValue } from "@/shared/config"

const apiScopes = [getRequiredEnvironmentValue("VITE_API_SCOPE")]

export type CurrentUser = {
  applicationUserId: string
  displayName: string
  hasCompletedOnboarding: boolean
  tacticusApiKeyMasked: string | null
  tacticusUserIdMasked: string | null
}

export async function acquireAccessToken(
  instance: IPublicClientApplication,
  account: AccountInfo
) {
  const authentication = await instance.acquireTokenSilent({
    account,
    scopes: apiScopes,
  })

  return authentication.accessToken
}

export async function getCurrentUser(
  instance: IPublicClientApplication,
  account: AccountInfo,
  signal?: AbortSignal
) {
  const accessToken = await acquireAccessToken(instance, account)

  return apiGet<CurrentUser>("/api/v1/me", { accessToken, signal })
}

export function isInteractionRequired(error: unknown) {
  return error instanceof InteractionRequiredAuthError
}

export function requestApiAccess(
  instance: IPublicClientApplication,
  account: AccountInfo
) {
  return instance.acquireTokenRedirect({ account, scopes: apiScopes })
}
