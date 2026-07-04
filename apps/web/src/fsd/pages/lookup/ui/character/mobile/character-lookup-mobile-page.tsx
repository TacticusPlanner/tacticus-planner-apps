import type { RefObject } from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"

import type { FactionGroup, Progression, Rank } from "@workspace/game-catalog"

import type { CampaignInsight } from "@/shared/lib"

import { CharacterLookupControls } from "../character-lookup-controls"
import { CharacterLookupResults } from "../character-lookup-results"
import type {
  BaseUpgradeView,
  RankGroupView,
} from "../character-lookup-results.types"
import { UnitProfile } from "../unit-profile"
import type { UnitProfileView } from "../unit-profile.types"

interface CharacterLookupMobilePageProps {
  characterGroups: FactionGroup[]
  characterId: string | undefined
  rankStart: Rank
  rankEnd: Rank
  progressionStart: Progression
  progressionEnd: Progression
  pointFive: boolean
  pointFiveDisabled: boolean
  loading: boolean
  profile: UnitProfileView | undefined
  baseUpgrades: BaseUpgradeView[]
  groups: RankGroupView[]
  campaignInsights: CampaignInsight[]
  eventInsights: CampaignInsight[]
  onCharacterChange: (id: string) => void
  onRangeChange: (start: Rank, end: Rank) => void
  onProgressionRangeChange: (start: Progression, end: Progression) => void
  onPointFiveChange: (value: boolean) => void
  onApply: () => void
  applyDisabled: boolean
  resultsRef?: RefObject<HTMLDivElement | null>
}

export function CharacterLookupMobilePage({
  loading,
  characterGroups,
  characterId,
  rankStart,
  rankEnd,
  progressionStart,
  progressionEnd,
  pointFive,
  pointFiveDisabled,
  profile,
  baseUpgrades,
  groups,
  campaignInsights,
  eventInsights,
  onCharacterChange,
  onRangeChange,
  onProgressionRangeChange,
  onPointFiveChange,
  onApply,
  applyDisabled,
  resultsRef,
}: CharacterLookupMobilePageProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
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
        onApply={onApply}
        applyDisabled={applyDisabled}
        isMobile={true}
      />
      <div
        ref={resultsRef}
        className="scroll-mt-[calc(var(--mobile-header-height)+1rem)]"
        data-testid="character-lookup-results-region"
      >
        <div className="flex flex-col gap-6">
          {profile ? <UnitProfile profile={profile} /> : null}
          <CharacterLookupResults
            baseUpgrades={baseUpgrades}
            groups={groups}
            campaignInsights={campaignInsights}
            eventInsights={eventInsights}
            isMobile={true}
          />
        </div>
      </div>
    </div>
  )
}
