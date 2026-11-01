import { useLocation, useNavigate, useSearchParams } from "react-router"

import {
  isGoalStatusFilterValue,
  isGoalTypeFilterValue,
  type GoalStatusFilterValue,
  type GoalTypeFilterValue,
} from "@/entities/goal"
import { useSearchParamState } from "@/shared/lib"

const PARAM = "goal"

/**
 * The Goals list's status and Type filters as `?status=` / `?type=` (goals-navigation: "Goals list
 * controls are URL state"). Replace history, so Back leaves the page rather than stepping through
 * filters; a missing or unknown value is the control's default.
 */
export function useGoalsListFilters() {
  const [tab, setTab] = useSearchParamState<GoalStatusFilterValue>(
    "status",
    isGoalStatusFilterValue,
    "all"
  )
  const [goalType, setGoalType] = useSearchParamState<GoalTypeFilterValue>(
    "type",
    isGoalTypeFilterValue,
    "all"
  )
  return { tab, setTab, goalType, setGoalType }
}

/**
 * The open Edit goal dialog as the `?goal=` search param (goal-edit-dialog: "The open Edit goal
 * dialog is addressable"). Opening pushes an entry, marked in router state, so Back closes it;
 * the id is validated once the goal list has loaded and kept while it loads. Closing steps back
 * over the entry this page pushed; a reloaded or shared dialog has none, so the param is replaced
 * away instead of leaving the page.
 */
export function useGoalEditParam(goalIds: string[], goalsLoaded: boolean) {
  const navigate = useNavigate()
  const location = useLocation()
  const [, setSearchParams] = useSearchParams()
  const [goalId, setGoalId] = useSearchParamState<string>(
    PARAM,
    (id) => (goalsLoaded ? goalIds.includes(id) : undefined),
    "",
    { history: "push" }
  )

  const openEditGoal = (id: string) =>
    setGoalId(id, { state: { goalEditPushed: true } })
  const closeEditGoal = () => {
    if ((location.state as { goalEditPushed?: boolean } | null)?.goalEditPushed)
      void navigate(-1)
    else
      setSearchParams(
        (previous) => {
          previous.delete(PARAM)
          return previous
        },
        { replace: true }
      )
  }

  return { editGoalId: goalId || null, openEditGoal, closeEditGoal }
}
