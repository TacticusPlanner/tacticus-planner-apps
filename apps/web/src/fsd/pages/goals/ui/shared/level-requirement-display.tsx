import { useTranslation } from "react-i18next"

import type { LevelRequirementProgress } from "../../model/attainment/level-requirement-progress"
import { GoalProgressDisplay, GoalTargetDisplay } from "./goal-progress-visuals"
import { formatGoalRemainingText } from "./goal-remaining-text"

/** The level requirement of a Rank/Ability goal — required level, current level, remaining XP, and
 * Potential progress from owned XP books — rendered under the goal's own target/progress/remaining
 * cells rather than as a goal of its own (integrate-level-progression-into-rank-goals). Ordinary
 * progress, never a blocker or a dependency. Each piece is a separate component so the desktop table
 * can drop them into its Target, Progress, and Remaining columns while the mobile card stacks them;
 * none render when the character's level is already sufficient (`levelRequirement` is `null`). */
export function LevelRequirementTarget({
  levelRequirement,
}: {
  levelRequirement: LevelRequirementProgress | null | undefined
}) {
  if (!levelRequirement) return null
  return (
    <div className="mt-1" data-testid="level-requirement-target">
      <GoalTargetDisplay progress={levelRequirement} />
    </div>
  )
}

/** The requirement's Potential-only bar: leveling happens as a side effect of ranking up, so the
 * actual ratio would just repeat the "Lv 44 → 50" text beside it — only how far owned books could get
 * the character is new information, so `potentialOnly` renders it the way potential progress is
 * rendered everywhere else (the striped bar and small primary-colored percent). */
export function LevelRequirementProgressBar({
  levelRequirement,
  potentialRatio,
}: {
  levelRequirement: LevelRequirementProgress | null | undefined
  potentialRatio: number | undefined
}) {
  if (!levelRequirement) return null
  return (
    <div className="mt-1" data-testid="level-requirement-progress">
      <GoalProgressDisplay
        potentialOnly
        potentialRatio={potentialRatio}
        progress={levelRequirement}
      />
    </div>
  )
}

/** The requirement's own "N levels remaining (M XP)" line — always-visible text (a sub-line has no
 * hover target of its own worth relying on). */
export function LevelRequirementRemaining({
  levelRequirement,
}: {
  levelRequirement: LevelRequirementProgress | null | undefined
}) {
  const { t, i18n } = useTranslation()
  if (!levelRequirement) return null
  const remainingText = formatGoalRemainingText(
    t,
    i18n?.resolvedLanguage,
    levelRequirement,
    null,
    undefined
  )
  if (!remainingText) return null

  return (
    <span
      className="mt-1 block max-w-[190px] truncate text-xs text-muted-foreground"
      data-testid="level-requirement-remaining"
      title={remainingText}
    >
      {remainingText}
    </span>
  )
}

/** The three pieces stacked, for surfaces (the goal detail) that show the requirement as one block. */
export function LevelRequirementSummary({
  levelRequirement,
  potentialRatio,
}: {
  levelRequirement: LevelRequirementProgress | null | undefined
  potentialRatio: number | undefined
}) {
  if (!levelRequirement) return null
  return (
    <div className="grid gap-1" data-testid="goal-detail-level-requirement">
      <LevelRequirementTarget levelRequirement={levelRequirement} />
      <LevelRequirementProgressBar
        levelRequirement={levelRequirement}
        potentialRatio={potentialRatio}
      />
      <LevelRequirementRemaining levelRequirement={levelRequirement} />
    </div>
  )
}
