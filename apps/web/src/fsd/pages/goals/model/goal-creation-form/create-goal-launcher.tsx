import type { ReactNode } from "react"

import {
  CreateGoalLauncherContext,
  type LaunchCreateGoal,
} from ".//create-goal-launcher-context"

export function CreateGoalLauncherProvider({
  children,
  onLaunch,
}: {
  children: ReactNode
  onLaunch: LaunchCreateGoal
}) {
  return (
    <CreateGoalLauncherContext.Provider value={onLaunch}>
      {children}
    </CreateGoalLauncherContext.Provider>
  )
}
