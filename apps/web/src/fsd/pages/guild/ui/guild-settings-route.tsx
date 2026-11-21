import { useOutletContext } from "react-router"

import { ReplaceGuildApiKeyCard } from "@/features/guild-access"

import type { GuildOutletContext } from "./guild-outlet-context"
import { useGuildTutorial } from "./guild.tutorial"

/** Route element for `/guild/settings`, rendered inside GuildRegisteredView's `<Outlet/>`. */
export function GuildSettingsRoute() {
  const { guild, onGuildUpdated } = useOutletContext<GuildOutletContext>()
  useGuildTutorial("settings")

  return (
    <div className="flex flex-col gap-4" data-testid="guild-settings">
      <ReplaceGuildApiKeyCard guild={guild} onReplaced={onGuildUpdated} />
    </div>
  )
}
