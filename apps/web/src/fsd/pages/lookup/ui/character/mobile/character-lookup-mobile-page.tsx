import { useEffect, useRef } from "react"
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
  includeOwned: boolean
  includeOwnedDisabled: boolean
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
  onIncludeOwnedChange: (value: boolean) => void
  onApply: () => void
  applyDisabled: boolean
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
}: CharacterLookupMobilePageProps) {
  const resultsRef = useRef<HTMLDivElement>(null)
  const pendingScrollRef = useRef(false)

  // Only the Apply button should trigger this scroll - picking a different character also
  // recomputes profile/groups/baseUpgrades (it commits immediately, see useLookupSelection), but
  // that shouldn't yank the page down, so the pending flag is only ever set from handleApply below.
  useEffect(() => {
    if (!pendingScrollRef.current) return
    pendingScrollRef.current = false
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [profile, groups, baseUpgrades])

  const handleApply = () => {
    onApply()
    pendingScrollRef.current = true
  }

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
        includeOwned={includeOwned}
        includeOwnedDisabled={includeOwnedDisabled}
        onIncludeOwnedChange={onIncludeOwnedChange}
        onApply={handleApply}
        applyDisabled={applyDisabled}
        isMobile={true}
      />
      <div
        className="flex scroll-mt-(--mobile-header-height) flex-col gap-8"
        data-testid="lookup-results"
        ref={resultsRef}
      >
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
  )
}
