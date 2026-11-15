import type { ReactNode } from "react"

import { CreateGoalLauncherContext } from "./create-goal-launcher-context"
import type { LaunchCreateGoal } from "./create-goal-launcher-context"

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
