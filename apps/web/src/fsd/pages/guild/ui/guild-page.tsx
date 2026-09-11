import { GuildAccessBoundary } from "@/features/guild-access"
import { PageContainer } from "@/widgets/page-container"

import { GuildRegisteredView } from "./guild-registered-view"

export function GuildPage() {
  return (
    <PageContainer data-testid="guild-page">
      <GuildAccessBoundary>
        {(guild, refresh) => (
          <GuildRegisteredView
            guild={guild}
            onSynced={refresh}
            onPurged={refresh}
          />
        )}
      </GuildAccessBoundary>
    </PageContainer>
  )
}
