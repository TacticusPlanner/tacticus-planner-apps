import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiGet, apiPut } from "@/shared/api"
import { acquireAccessToken } from "@/shared/auth"

import type { OnslaughtProgress } from "../model/types"

const path = "/api/v1/me/player-data-overrides/onslaught-progress"

export async function getOnslaughtProgress(
  instance: IPublicClientApplication,
  account: AccountInfo
) {
  const accessToken = await acquireAccessToken(instance, account)
  return apiGet<OnslaughtProgress>(path, { accessToken })
}

export async function updateOnslaughtProgress(
  instance: IPublicClientApplication,
  account: AccountInfo,
  progress: OnslaughtProgress
) {
  const accessToken = await acquireAccessToken(instance, account)
  return apiPut<OnslaughtProgress>(path, { accessToken, body: progress })
}
