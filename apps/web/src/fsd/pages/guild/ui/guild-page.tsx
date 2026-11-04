import { GuildAccessBoundary } from "@/features/guild-access"
import { PageContainer } from "@/widgets/page-container"

import { GuildRegisteredView } from "./guild-registered-view"

export { GuildSettingsRoute } from "./guild-settings-route"

export function GuildPage() {
  return (
    <PageContainer data-testid="guild-page">
      <GuildAccessBoundary>
        {(guild, refresh, applyGuild) => (
          <GuildRegisteredView
            guild={guild}
            onSynced={applyGuild}
            onPurged={refresh}
          />
        )}
      </GuildAccessBoundary>
    </PageContainer>
  )
}
