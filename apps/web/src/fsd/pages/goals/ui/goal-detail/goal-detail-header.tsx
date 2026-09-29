import type { GoalDetail } from "@/entities/goal"

import type { GoalBlockers } from "../../model/blockers/goal-blockers"
import type { LevelRequirementProgress } from "../../model/attainment/level-requirement-progress"
import type { GoalProgress } from "../../model/attainment/goal-progress"
import type { GoalProject } from "../../model/shared/types"
import { NO_BLOCKERS } from "../../model/attainment/goal-overview-metrics-defaults"
import {
  GoalProgressDisplay,
  GoalTargetDisplay,
} from "../shared/goal-progress-visuals"
import { GoalProjectBadges } from "../shared/goal-visuals"
import { LevelRequirementSummary } from "../shared/level-requirement-display"
import { BlockedIndicator, StatusBadge } from "../shared/status-badge"

/**
 * The status/blocked badges, required-level summary, and (edit mode only) the target/progress
 * strip and project badges shown above the target editor. Split out of `goal-detail-sheet.tsx` to
 * keep that file under this repo's max-lines rule, mirroring `goal-estimate-section.tsx`.
 */
export function GoalDetailHeader({
  detail,
  mode,
  progress,
  blockers,
  levelRequirement,
  levelPotentialRatio,
  availableBookCount,
  neededBookCount,
  xpBookRarity,
  potentialRatio,
  assignedProjects,
}: {
  detail: GoalDetail
  mode: "view" | "edit"
  progress: GoalProgress
  blockers: GoalBlockers | undefined
  levelRequirement: LevelRequirementProgress | null | undefined
  levelPotentialRatio: number | undefined
  availableBookCount: number
  neededBookCount: number
  xpBookRarity: string
  potentialRatio: number | undefined
  assignedProjects: GoalProject[]
}) {
  return (
    <div className="grid gap-2 px-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={detail.status} />
        <BlockedIndicator
          blockers={blockers ?? NO_BLOCKERS}
          progress={progress}
        />
      </div>
      <LevelRequirementSummary
        availableBookCount={availableBookCount}
        levelRequirement={levelRequirement}
        neededBookCount={neededBookCount}
        potentialRatio={levelPotentialRatio}
        xpBookRarity={xpBookRarity}
      />
      {mode === "edit" ? (
        <>
          <GoalTargetDisplay
            entityType={detail.entityType}
            progress={progress}
          />
          <GoalProgressDisplay
            potentialRatio={potentialRatio}
            progress={progress}
          />
          {assignedProjects.length > 0 ? (
            <GoalProjectBadges projects={assignedProjects} />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
