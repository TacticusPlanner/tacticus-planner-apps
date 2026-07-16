import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"

import { GoalRefreshContext } from "./goal-refresh-context"

export function GoalRefreshProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0)
  const subscribers = useRef(new Map<string, () => Promise<void>>())
  const registerGoalRefetch = useCallback(
    (key: string, callback: () => Promise<void>) => {
      subscribers.current.set(key, callback)
      return () => {
        if (subscribers.current.get(key) === callback) {
          subscribers.current.delete(key)
        }
      }
    },
    []
  )
  const refreshGoals = useCallback(async () => {
    setRevision((value) => value + 1)
    await Promise.all([...subscribers.current.values()].map((load) => load()))
  }, [])
  const value = useMemo(
    () => ({ revision, refreshGoals, registerGoalRefetch }),
    [revision, refreshGoals, registerGoalRefetch]
  )
  return <GoalRefreshContext value={value}>{children}</GoalRefreshContext>
}
