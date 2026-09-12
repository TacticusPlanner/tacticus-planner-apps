import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { GuildAccessBoundary } from "@/features/guild-access"

import { useGuildRaidsTutorial } from "./guild-raids.tutorial"
import type { GuildRaidsViewModel } from "./guild-raid-status-view-model"
import { useGuildRaidsViewModel } from "./use-guild-raids-view-model"
import { GuildRaidFreshnessFooter } from "./status/guild-raid-freshness-footer"
import { GuildRaidResourcesCard } from "./status/guild-raid-resources-card"
import { GuildRaidStatusRegion } from "./status/guild-raid-status-region"

function GuildRaidSidebar({ viewModel }: { viewModel: GuildRaidsViewModel }) {
  const { status } = viewModel
  const freshnessStatus =
    status.kind === "active" || status.kind === "noActiveSeason"
      ? status
      : undefined

  return (
    <div className="flex flex-col gap-4">
      {freshnessStatus ? (
        <GuildRaidFreshnessFooter
          freshness={freshnessStatus.freshness}
          observedAtMs={freshnessStatus.observedAtMs}
          lastGuildSyncSucceededAtMs={
            freshnessStatus.lastGuildSyncSucceededAtMs
          }
          hasRefreshError={viewModel.hasRefreshError}
          isRefreshing={viewModel.isRefreshing}
          refresh={viewModel.refresh}
        />
      ) : null}
      <GuildRaidResourcesCard resources={viewModel.resources} />
    </div>
  )
}

function GuildRaidsReadyContent({ isMobile }: { isMobile: boolean }) {
  const viewModel = useGuildRaidsViewModel()

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        <GuildRaidSidebar viewModel={viewModel} />
        <div data-testid="guild-raid-status-section">
          <GuildRaidStatusRegion isMobile={true} viewModel={viewModel} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-8">
      <div className="sticky top-6 w-80 shrink-0">
        <GuildRaidSidebar viewModel={viewModel} />
      </div>
      <div className="min-w-0 flex-1" data-testid="guild-raid-status-section">
        <GuildRaidStatusRegion isMobile={false} viewModel={viewModel} />
      </div>
    </div>
  )
}

export function GuildRaidsPage() {
  const isMobile = useIsMobile()
  useGuildRaidsTutorial()

  return (
    <div
      className="flex flex-col gap-5 md:gap-7"
      data-testid={
        isMobile ? "guild-raids-mobile-shell" : "guild-raids-desktop-shell"
      }
    >
      <div className="w-full" data-testid="guild-raids-access-shell">
        <GuildAccessBoundary showGuildManagementLink>
          {() => <GuildRaidsReadyContent isMobile={isMobile} />}
        </GuildAccessBoundary>
      </div>
    </div>
  )
}
