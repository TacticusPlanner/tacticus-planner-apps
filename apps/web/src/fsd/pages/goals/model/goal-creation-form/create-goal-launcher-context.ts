import { createContext, useContext } from "react"
import type { Progression, UnitId } from "@workspace/game-domain"

export type CreateGoalPrefill =
  | {
      entityType: "Character"
      entityId: UnitId
      goalType: "Level"
      requiredLevel: number
      projectIds: string[]
    }
  | {
      entityType: "Character" | "Mow"
      entityId: UnitId
      goalType: "Ascension"
      requiredProgression: Progression
      projectIds: string[]
    }

export type LaunchCreateGoal = (prefill?: CreateGoalPrefill) => void

export const CreateGoalLauncherContext = createContext<LaunchCreateGoal | null>(
  null
)

export function useCreateGoalLauncher(): LaunchCreateGoal {
  const value = useContext(CreateGoalLauncherContext)
  if (!value) throw new Error("CreateGoalLauncherProvider is missing")
  return value
}
