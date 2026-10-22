import { apiClient, unwrap, type ApiSchemas } from "@/shared/api"

// Wire shapes, generated from the API's OpenAPI document (spec: api-contract-sync); never hand-written.
type S = ApiSchemas

/** The backend's GuildRole enum by its C# name — not the upstream Tacticus spelling (CO_LEADER etc.). */
export type GuildRole = S["GuildRole"]
export type GuildMemberSummary = S["GuildMemberSummary"]
export type RegisteredGuild = S["RegisteredGuildResponse"]
export type MyGuildResponse = S["MyGuildResponse"]

export function getMyGuild(signal?: AbortSignal) {
  return unwrap(apiClient().GET("/api/v1/guild", { signal }))
}

export function registerGuild(request: S["RegisterGuildRequest"]) {
  return unwrap(apiClient().POST("/api/v1/guild/register", { body: request }))
}

export function syncMyGuild() {
  return unwrap(apiClient().POST("/api/v1/guild/sync"))
}

export async function purgeGuild() {
  await unwrap(apiClient().DELETE("/api/v1/guild"))
}
