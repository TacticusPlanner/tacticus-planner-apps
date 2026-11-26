import { storedPreference, useStoredPreference } from "@/shared/lib"

export type GoalsView = "Cards" | "Table"

const GOALS_VIEW = storedPreference("goals", "view")

const parseGoalsView = (stored: unknown): GoalsView =>
  stored === "Table" ? "Table" : "Cards"

/**
 * This browser's Goals view (goal-list-layout: Cards by default, stored per device). `GoalsLayout`
 * and `GoalsPage` both read it, and a toggle in the page reaches the layout's width cap at once.
 */
export function useGoalsView() {
  const [view, setView] = useStoredPreference(GOALS_VIEW, parseGoalsView)
  return { view, setView }
}
