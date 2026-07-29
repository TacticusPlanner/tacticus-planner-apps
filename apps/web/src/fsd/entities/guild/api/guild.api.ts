import { apiDelete, apiGet, apiPost } from "@/shared/api"

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

export function getMyGuild(signal?: AbortSignal) {
  return apiGet<MyGuildResponse>("/api/v1/guilds/me", { signal })
}

export function registerGuild(request: { guildApiToken: string }) {
  return apiPost<RegisteredGuild>("/api/v1/guilds/register", { body: request })
}

export function syncMyGuild() {
  return apiPost<RegisteredGuild>("/api/v1/guilds/me/sync", {})
}

export async function purgeGuild() {
  await apiDelete("/api/v1/guilds/me", {})
}
