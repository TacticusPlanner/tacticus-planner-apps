import { Skeleton } from "@workspace/ui/components/skeleton"

import type {
  FactionGroup,
  Progression,
  Rank,
  UnitId,
} from "@workspace/game-domain"

import type { CampaignInsight } from "@/features/campaign-insights"

import { CharacterLookupControls } from "../character-lookup-controls"
import { CharacterLookupResults } from "../character-lookup-results"
import type {
  BaseUpgradeViewModel,
  RankGroupViewModel,
} from "../character-lookup-results.view-model"
import { UnitProfile } from "../unit-profile"
import type { UnitProfileViewModel } from "../unit-profile.view-model"

interface CharacterLookupDesktopPageProps {
  characterGroups: FactionGroup[]
  characterId: UnitId | undefined
  rankStart: Rank
  rankEnd: Rank
  progressionStart: Progression
  progressionEnd: Progression
  pointFive: boolean
  pointFiveDisabled: boolean
  includeOwned: boolean
  includeOwnedDisabled: boolean
  loading: boolean
  profile: UnitProfileViewModel | undefined
  baseUpgrades: BaseUpgradeViewModel[]
  groups: RankGroupViewModel[]
  campaignInsights: CampaignInsight[]
  eventInsights: CampaignInsight[]
  onCharacterChange: (id: UnitId) => void
  onRangeChange: (start: Rank, end: Rank) => void
  onProgressionRangeChange: (start: Progression, end: Progression) => void
  onPointFiveChange: (value: boolean) => void
  onIncludeOwnedChange: (value: boolean) => void
  onApply: () => void
  applyDisabled: boolean
}

export function CharacterLookupDesktopPage({
  loading,
  characterGroups,
  characterId,
  rankStart,
  rankEnd,
  progressionStart,
  progressionEnd,
  pointFive,
  pointFiveDisabled,
  includeOwned,
  includeOwnedDisabled,
  profile,
  baseUpgrades,
  groups,
  campaignInsights,
  eventInsights,
  onCharacterChange,
  onRangeChange,
  onProgressionRangeChange,
  onPointFiveChange,
  onIncludeOwnedChange,
  onApply,
  applyDisabled,
}: CharacterLookupDesktopPageProps) {
  if (loading) {
    return (
      <div className="flex gap-8">
        <Skeleton className="h-48 w-80 shrink-0" />
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-8">
      <div className="sticky top-6 w-80 shrink-0">
        <CharacterLookupControls
          characterGroups={characterGroups}
          characterId={characterId}
          onCharacterChange={onCharacterChange}
          rankStart={rankStart}
          rankEnd={rankEnd}
          onRangeChange={onRangeChange}
          progressionStart={progressionStart}
          progressionEnd={progressionEnd}
          onProgressionRangeChange={onProgressionRangeChange}
          pointFive={pointFive}
          pointFiveDisabled={pointFiveDisabled}
          onPointFiveChange={onPointFiveChange}
          includeOwned={includeOwned}
          includeOwnedDisabled={includeOwnedDisabled}
          onIncludeOwnedChange={onIncludeOwnedChange}
          onApply={onApply}
          applyDisabled={applyDisabled}
          isMobile={false}
        />
      </div>
      <div
        className="flex min-w-0 flex-1 flex-col gap-6"
        data-testid="lookup-results"
      >
        {profile ? <UnitProfile profile={profile} /> : null}
        <CharacterLookupResults
          baseUpgrades={baseUpgrades}
          groups={groups}
          campaignInsights={campaignInsights}
          eventInsights={eventInsights}
          isMobile={false}
          showOwned={!includeOwnedDisabled}
        />
      </div>
    </div>
  )
}
