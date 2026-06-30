import { Skeleton } from "@workspace/ui/components/skeleton"

import type { FactionGroup } from "@/entities/faction"
import type { RankId } from "@/entities/rank"

import { RankLookupControls } from "../rank-lookup-controls"
import {
  RankLookupResults,
  type MaterialView,
  type RankGroupView,
} from "../rank-lookup-results"

export interface RankLookupDesktopPageProps {
  characterGroups: FactionGroup[]
  characterId: string | undefined
  rankStart: RankId
  rankEnd: RankId
  pointFive: boolean
  loading: boolean
  materials: MaterialView[]
  groups: RankGroupView[]
  onCharacterChange: (id: string) => void
  onRangeChange: (start: RankId, end: RankId) => void
  onPointFiveChange: (value: boolean) => void
}

export function RankLookupDesktopPage({
  loading,
  characterGroups,
  characterId,
  rankStart,
  rankEnd,
  pointFive,
  materials,
  groups,
  onCharacterChange,
  onRangeChange,
  onPointFiveChange,
}: RankLookupDesktopPageProps) {
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
        <RankLookupControls
          characterGroups={characterGroups}
          characterId={characterId}
          onCharacterChange={onCharacterChange}
          rankStart={rankStart}
          rankEnd={rankEnd}
          onRangeChange={onRangeChange}
          pointFive={pointFive}
          onPointFiveChange={onPointFiveChange}
          isMobile={false}
        />
      </div>
      <div className="min-w-0 flex-1">
        <RankLookupResults
          materials={materials}
          groups={groups}
          isMobile={false}
        />
      </div>
    </div>
  )
}
