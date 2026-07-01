import { Skeleton } from "@workspace/ui/components/skeleton"

import type { FactionGroup, Rank, RarityStars } from "@workspace/game-catalog"

import { CharacterLookupControls } from "../character-lookup-controls"
import {
  CharacterLookupResults,
  type BaseUpgradeView,
  type RankGroupView,
} from "../character-lookup-results"
import { UnitProfile, type UnitProfileView } from "../unit-profile"

export interface CharacterLookupMobilePageProps {
  characterGroups: FactionGroup[]
  characterId: string | undefined
  rankStart: Rank
  rankEnd: Rank
  progression: RarityStars
  pointFive: boolean
  pointFiveDisabled: boolean
  loading: boolean
  profile: UnitProfileView | undefined
  baseUpgrades: BaseUpgradeView[]
  groups: RankGroupView[]
  onCharacterChange: (id: string) => void
  onRangeChange: (start: Rank, end: Rank) => void
  onProgressionChange: (value: RarityStars) => void
  onPointFiveChange: (value: boolean) => void
  onApply: () => void
  applyDisabled: boolean
}

export function CharacterLookupMobilePage({
  loading,
  characterGroups,
  characterId,
  rankStart,
  rankEnd,
  progression,
  pointFive,
  pointFiveDisabled,
  profile,
  baseUpgrades,
  groups,
  onCharacterChange,
  onRangeChange,
  onProgressionChange,
  onPointFiveChange,
  onApply,
  applyDisabled,
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
        progression={progression}
        onProgressionChange={onProgressionChange}
        pointFive={pointFive}
        pointFiveDisabled={pointFiveDisabled}
        onPointFiveChange={onPointFiveChange}
        onApply={onApply}
        applyDisabled={applyDisabled}
        isMobile={true}
      />
      {profile ? <UnitProfile profile={profile} /> : null}
      <CharacterLookupResults
        baseUpgrades={baseUpgrades}
        groups={groups}
        isMobile={true}
      />
    </div>
  )
}
