import type { GuildRaidsViewModel } from "../guild-raid-status-view-model"
import { GuildRaidBossCard } from "./guild-raid-boss-card"
import { GuildRaidPrimeCard } from "./guild-raid-prime-card"
import { GuildRaidCatalogWarning } from "./guild-raid-status-states"
import { GuildRaidRefreshButton } from "./guild-raid-refresh-button"
import {
  GuildRaidStatusError,
  GuildRaidStatusLoading,
  GuildRaidStatusNeverObserved,
  GuildRaidStatusNoActiveSeason,
} from "./guild-raid-status-states"

export function GuildRaidStatusRegion({
  isMobile,
  viewModel,
}: {
  isMobile: boolean
  viewModel: GuildRaidsViewModel
}) {
  const { status, refresh, isRefreshing, hasRefreshError } = viewModel

  if (status.kind === "loading") {
    return <GuildRaidStatusLoading />
  }

  if (status.kind === "error") {
    return <GuildRaidStatusError retry={status.retry} />
  }

  if (status.kind === "neverObserved") {
    return (
      <div className="flex flex-col gap-3">
        <GuildRaidStatusNeverObserved />
        {hasRefreshError ? (
          <div className="flex justify-end">
            <GuildRaidRefreshButton
              refresh={refresh}
              isRefreshing={isRefreshing}
            />
          </div>
        ) : null}
      </div>
    )
  }

  if (status.kind === "noActiveSeason") {
    return <GuildRaidStatusNoActiveSeason />
  }

  const [leftPrime, rightPrime] = status.season.primes

  return (
    <div className="flex flex-col gap-4" data-testid="guild-raid-status-card">
      {status.catalogWarning ? <GuildRaidCatalogWarning /> : null}
      <div
        className="flex flex-col gap-4 md:grid md:grid-cols-3 md:items-start"
        data-testid="guild-raid-targets"
      >
        <GuildRaidBossCard isMobile={isMobile} season={status.season} />
        {leftPrime ? (
          <GuildRaidPrimeCard
            isMobile={isMobile}
            position="left"
            prime={leftPrime}
          />
        ) : null}
        {rightPrime ? (
          <GuildRaidPrimeCard
            isMobile={isMobile}
            position="right"
            prime={rightPrime}
          />
        ) : null}
      </div>
    </div>
  )
}
