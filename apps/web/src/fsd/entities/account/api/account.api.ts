import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiDelete, apiPost, apiPut } from "@/shared/api"
import { acquireAccessToken } from "@/shared/auth"

type UpdateTacticusIntegrationRequest = {
  // Omit to keep the currently stored key unchanged (only valid once an integration already exists).
  tacticusApiKey?: string
  // Omit to leave the stored user id unchanged; set clearTacticusUserId to remove it instead.
  tacticusUserId?: string
  clearTacticusUserId?: boolean
}

type TacticusIntegrationResult = {
  profileId: string
  tacticusUserIdConfigured: boolean
  tacticusApiKeyConfigured: boolean
  playerName: string | null
  powerLevel: number | null
  tacticusApiKeyMasked: string | null
  tacticusUserIdMasked: string | null
}

export function updateTacticusIntegration(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: UpdateTacticusIntegrationRequest
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPut<TacticusIntegrationResult>("/api/v1/me/tacticus-integration", {
      accessToken,
      body: request,
    })
  )
}

export type ImportV1ProfileRequest = {
  username: string
  password: string
  import: {
    personalTacticusApiKey: boolean
    tacticusUserId: boolean
    guildApiToken: boolean
    goals: boolean
  }
}

export type ImportPartResult = {
  status: "Imported" | "Skipped" | "Failed"
  code: string | null
  message: string | null
}

export type ImportV1ProfileResult = {
  tacticusUserId: ImportPartResult
  personalTacticusApiKey: ImportPartResult
  guildApiToken: ImportPartResult
  goals: ImportPartResult
  goalsImported: number
  goalsReplaced: number
  goalsSkipped: number
  goalIssues: { code: string; sourceGoalId: string | null; message: string }[]
}

export function importV1Profile(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: ImportV1ProfileRequest
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<ImportV1ProfileResult>("/api/v1/me/v1-import", {
      accessToken,
      body: request,
    })
  )
}

export async function purgeAccount(
  instance: IPublicClientApplication,
  account: AccountInfo
) {
  await withAccessToken(instance, account, (accessToken) =>
    apiDelete("/api/v1/me", { accessToken })
  )
}

async function withAccessToken<T>(
  instance: IPublicClientApplication,
  account: AccountInfo,
  action: (accessToken: string) => Promise<T>
) {
  const accessToken = await acquireAccessToken(instance, account)

  return action(accessToken)
}
