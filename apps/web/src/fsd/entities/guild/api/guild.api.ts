import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"

import { apiDelete, apiGet, apiPost } from "@/shared/api"
import { withAccessToken } from "@/shared/auth"

// Mirrors the backend's persistence-local GuildRole enum (TacticusPlanner.Persistence.Users.Guilds.GuildRole)
// serialized by its C# name — not the upstream Tacticus wire spelling (which uses CO_LEADER etc.).
export type GuildRole = "Leader" | "CoLeader" | "Officer" | "Member"

export type GuildMemberSummary = {
  guildMemberId: string
  maskedTacticusUserId: string
  linkedPlayerName: string | null
  isLinked: boolean
  role: GuildRole
  level: number
  lastActiveInGameOn: number | null
  lastActiveInPlannerOn: string | null
  displayLabel: string
}

export type RegisteredGuild = {
  guildId: string
  tacticusGuildId: string
  tag: string
  name: string
  level: number
  lastSyncSucceededAt: string | null
  callerRole: GuildRole
  canSynchronize: boolean
  members: GuildMemberSummary[]
}

export type MyGuildResponse = {
  state: "tacticusUserIdRequired" | "unregistered" | "registered"
  guild: RegisteredGuild | null
}

export function getMyGuild(
  instance: IPublicClientApplication,
  account: AccountInfo,
  signal?: AbortSignal
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiGet<MyGuildResponse>("/api/v1/guilds/me", { accessToken, signal })
  )
}

export function registerGuild(
  instance: IPublicClientApplication,
  account: AccountInfo,
  request: { guildApiToken: string }
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<RegisteredGuild>("/api/v1/guilds/register", {
      accessToken,
      body: request,
    })
  )
}

export function syncMyGuild(
  instance: IPublicClientApplication,
  account: AccountInfo
) {
  return withAccessToken(instance, account, (accessToken) =>
    apiPost<RegisteredGuild>("/api/v1/guilds/me/sync", { accessToken })
  )
}

export async function purgeGuild(
  instance: IPublicClientApplication,
  account: AccountInfo
) {
  await withAccessToken(instance, account, (accessToken) =>
    apiDelete("/api/v1/guilds/me", { accessToken })
  )
}
