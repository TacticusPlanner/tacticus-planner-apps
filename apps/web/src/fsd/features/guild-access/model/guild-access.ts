import type { MyGuildResponse, RegisteredGuild } from "@/entities/guild"

type GuildAccessQuerySnapshot = {
  data?: MyGuildResponse
  error: unknown
  isError: boolean
  isPending: boolean
}

export type GuildAccessState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "tacticus-user-id-required" }
  | { status: "unregistered" }
  | { status: "never-synchronized"; guild: RegisteredGuild }
  | { status: "ready"; guild: RegisteredGuild }

/** Resolves the current-guild query into the mutually exclusive access states shared by guild pages. */
export function resolveGuildAccess(
  query: GuildAccessQuerySnapshot
): GuildAccessState {
  if (query.isPending) return { status: "loading" }
  if (query.isError) return { status: "error", error: query.error }

  if (query.data?.state === "tacticusUserIdRequired") {
    return { status: "tacticus-user-id-required" }
  }
  if (query.data?.state === "unregistered") {
    return { status: "unregistered" }
  }
  if (query.data?.state === "registered" && query.data.guild) {
    return query.data.guild.lastSyncSucceededAt
      ? { status: "ready", guild: query.data.guild }
      : { status: "never-synchronized", guild: query.data.guild }
  }

  return { status: "error", error: null }
}
