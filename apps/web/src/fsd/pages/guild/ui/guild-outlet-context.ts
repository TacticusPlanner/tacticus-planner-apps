import type { RegisteredGuild } from "@/entities/guild"

/** What GuildRegisteredView hands its routed Guild tabs through `<Outlet context>`. */
export type GuildOutletContext = {
  guild: RegisteredGuild
  /** Writes a register/sync response as the current guild (no refetch). */
  onGuildUpdated: (guild: RegisteredGuild) => void
}
