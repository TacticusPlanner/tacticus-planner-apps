import { createContext, useContext } from "react"
import type { Progression, Rank, UnitId } from "@workspace/game-domain"

/**
 * What a goal-creation launch preselects in the shell's creation sheet. `projectIds` absent means
 * no project context: the sheet keeps its remembered-membership / Default-project fallback
 * (`goal-creation-entry-points`).
 */
export type CreateGoalPrefill =
  | {
      entityType: "Character" | "Mow"
      entityId: UnitId
      goalType: "Ascension"
      requiredProgression: Progression
      projectIds?: string[]
    }
  | {
      entityType: "Character" | "Mow"
      entityId: UnitId
      goalType: "Rank"
      rankEnd: Rank
      projectIds?: string[]
    }
  | {
      entityType: "Character" | "Mow"
      entityId: UnitId
      goalType: "Unlock"
      projectIds?: string[]
    }
  // Unit-only: the unit is selected and every goal type is left unticked.
  | {
      entityType: "Character" | "Mow"
      entityId: UnitId
      projectIds?: string[]
    }
  // Project-only: preselect a project before an entity/goal type is chosen.
  | { projectIds: string[] }

export type LaunchCreateGoal = (prefill?: CreateGoalPrefill) => void

/** Provided by the app shell, which owns the single creation sheet; any page may launch it. */
export const CreateGoalLauncherContext = createContext<LaunchCreateGoal | null>(
  null
)

export function useCreateGoalLauncher(): LaunchCreateGoal {
  const value = useContext(CreateGoalLauncherContext)
  if (!value) throw new Error("CreateGoalLauncherProvider is missing")
  return value
}
