import { createContext, useContext } from "react"

export type GoalRefreshContextValue = {
  revision: number
  refreshGoals: () => Promise<void>
  registerGoalRefetch: (
    key: string,
    callback: () => Promise<void>
  ) => () => void
}

export const GoalRefreshContext = createContext<GoalRefreshContextValue | null>(
  null
)

export function useGoalRefresh() {
  const value = useContext(GoalRefreshContext)
  if (!value)
    throw new Error("useGoalRefresh must be used within GoalRefreshProvider")
  return value
}
