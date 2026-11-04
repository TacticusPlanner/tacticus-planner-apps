import { useOutletContext } from "react-router"

import type { GuildOutletContext } from "./guild-outlet-context"
import { GuildMembersList } from "./guild-members-list"

/**
 * Route element for `/guild/members`, rendered inside GuildRegisteredView's `<Outlet/>`. Reads the
 * guild's member list from outlet context rather than route params/loader data, since the guild itself
 * is only known once GuildPage's `/api/v1/guild` fetch resolves.
 */
export function GuildMembersRoute() {
  const { guild } = useOutletContext<GuildOutletContext>()

  return <GuildMembersList members={guild.members} />
}
