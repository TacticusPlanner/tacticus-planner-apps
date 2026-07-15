import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiGet, apiPut } from "@/shared/api"
import { acquireAccessToken } from "@/shared/auth"

import type { PlanningSettings } from "../model/types"

export async function getPlanningSettings(
  instance: IPublicClientApplication,
  account: AccountInfo
) {
  const accessToken = await acquireAccessToken(instance, account)
  return apiGet<PlanningSettings>("/api/v1/me/planning-settings", {
    accessToken,
  })
}

export async function updatePlanningSettings(
  instance: IPublicClientApplication,
  account: AccountInfo,
  settings: PlanningSettings
) {
  const accessToken = await acquireAccessToken(instance, account)
  return apiPut<PlanningSettings>("/api/v1/me/planning-settings", {
    accessToken,
    body: settings,
  })
}
