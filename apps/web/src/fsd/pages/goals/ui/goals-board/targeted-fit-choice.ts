import { isSeasonFitMode } from "@/features/goal-planning"
import type { SeasonFitMode } from "@/features/goal-planning"

/**
 * What the Season fit select measures in a project scope with a target (project-deadline-fit): the
 * project's own deadline (the default), a Season fit mode, or nothing. Stored apart from the unscoped
 * Season fit choice so switching one never changes the other.
 */
export type TargetedFitChoice = SeasonFitMode | "projectDeadline"

export const TARGETED_FIT_STORAGE_KEY = "goals.overview.targetedFit"

export function isTargetedFitChoice(
  value: unknown
): value is TargetedFitChoice {
  return value === "projectDeadline" || isSeasonFitMode(value)
}

/** The Season fit mode to run: the targeted choice in a targeted scope (Off when it is the deadline). */
export function effectiveSeasonFitMode(
  targeted: boolean,
  seasonFitMode: SeasonFitMode,
  targetedChoice: TargetedFitChoice
): SeasonFitMode {
  if (!targeted) return seasonFitMode
  return targetedChoice === "projectDeadline" ? "off" : targetedChoice
}
