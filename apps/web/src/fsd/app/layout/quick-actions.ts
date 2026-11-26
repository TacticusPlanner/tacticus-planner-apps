import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export type QuickActionId =
  | "signIn"
  | "signUp"
  | "createGoal"
  | "createProject"
  | "sync"
  | "feedback"
  | "reportBug"
  | "tourPage"

export type QuickAction = {
  id: QuickActionId
  icon: LucideIcon
  label: string
  description: string
  /** Extra search terms beyond the label/description (e.g. "api" for sync). */
  keywords: string[]
  /** Set when the action is visible but cannot run right now; shown instead of the description. */
  disabledReason?: ReactNode
}

/** What the search surfaces need: the live eligible actions, the guarded selection, and the
 *  post-close dispatch. See `useQuickActions`. */
export type QuickActionsController = {
  actions: QuickAction[]
  /** Queues an enabled action for dispatch; returns false (leave search open) if it is gone or
   *  disabled now. */
  select: (id: QuickActionId) => boolean
  /** Runs the queued action once, after the search modal layer has released focus/pointer locks. */
  flush: () => void
}
