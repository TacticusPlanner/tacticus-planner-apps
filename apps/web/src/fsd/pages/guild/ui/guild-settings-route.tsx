import { useOutletContext } from "react-router"

import { ReplaceGuildApiKeyCard } from "@/features/guild-access"

import type { GuildOutletContext } from "./guild-outlet-context"

/** Route element for `/guild/settings`, rendered inside GuildRegisteredView's `<Outlet/>`. */
export function GuildSettingsRoute() {
  const { guild, onGuildUpdated } = useOutletContext<GuildOutletContext>()

  return (
    <div className="flex flex-col gap-4">
      <ReplaceGuildApiKeyCard guild={guild} onReplaced={onGuildUpdated} />
    </div>
  )
}
