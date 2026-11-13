import type { BulkPlannedGoal } from "./bulk-goal-plan"

type PlannedAbilityTrack = {
  track: "active" | "passive"
  start: number
  end: number
}

/** The ability tracks an Abilities goal raises, Active first; a track already at its target is left out. */
export function plannedAbilityTracks(
  goal: Extract<BulkPlannedGoal, { goalType: "Ability" }>
): PlannedAbilityTrack[] {
  const tracks: PlannedAbilityTrack[] = [
    { track: "active", start: goal.activeStart, end: goal.activeEnd },
    { track: "passive", start: goal.passiveStart, end: goal.passiveEnd },
  ]
  return tracks.filter((track) => track.end > track.start)
}
