import { useOutletContext } from "react-router"

import type { GuildMemberSummary } from "@/entities/guild"

import { GuildMembersList } from "./guild-members-list"

/**
 * Route element for `/guild/members`, rendered inside GuildRegisteredView's `<Outlet/>`. Reads the
 * guild's member list from outlet context rather than route params/loader data, since the guild itself
 * is only known once GuildPage's `/api/v1/guilds/me` fetch resolves.
 */
export function GuildMembersRoute() {
  const members = useOutletContext<GuildMemberSummary[]>()

  return <GuildMembersList members={members} />
}
