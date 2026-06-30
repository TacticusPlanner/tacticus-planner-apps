import { Skeleton } from "@workspace/ui/components/skeleton"

import type { RankId } from "@workspace/game-catalog"

import type { FactionGroup } from "@/entities/faction"

import { RankLookupControls } from "../rank-lookup-controls"
import {
  RankLookupResults,
  type BaseUpgradeView,
  type RankGroupView,
} from "../rank-lookup-results"

export interface RankLookupMobilePageProps {
  characterGroups: FactionGroup[]
  characterId: string | undefined
  rankStart: RankId
  rankEnd: RankId
  pointFive: boolean
  loading: boolean
  baseUpgrades: BaseUpgradeView[]
  groups: RankGroupView[]
  onCharacterChange: (id: string) => void
  onRangeChange: (start: RankId, end: RankId) => void
  onPointFiveChange: (value: boolean) => void
}

export function RankLookupMobilePage({
  loading,
  characterGroups,
  characterId,
  rankStart,
  rankEnd,
  pointFive,
  baseUpgrades,
  groups,
  onCharacterChange,
  onRangeChange,
  onPointFiveChange,
}: RankLookupMobilePageProps) {
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
      <RankLookupControls
        characterGroups={characterGroups}
        characterId={characterId}
        onCharacterChange={onCharacterChange}
        rankStart={rankStart}
        rankEnd={rankEnd}
        onRangeChange={onRangeChange}
        pointFive={pointFive}
        onPointFiveChange={onPointFiveChange}
        isMobile={true}
      />
      <RankLookupResults
        baseUpgrades={baseUpgrades}
        groups={groups}
        isMobile={true}
      />
    </div>
  )
}
