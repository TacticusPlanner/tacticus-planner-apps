import { useEffect, useRef } from "react"
import {
  HelpCircle,
  MessageSquareText,
  PlusCircle,
  FolderPlus,
  RefreshCw,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { useTour } from "@/shared/tour"

import { usePlayerDataSyncStatus } from "../providers/player-data-sync-button"
import { useUserJot } from "../providers/userjot-provider"
import type {
  QuickAction,
  QuickActionId,
  QuickActionsController,
} from "./quick-actions"

/**
 * The single quick-action inventory and dispatch policy for desktop search and the mobile Menu
 * drawer. Availability is derived from live providers on every render; `select`/`flush` re-read
 * the latest derivation so a stale result can't bypass an auth/running-state guard.
 */
export function useQuickActions({
  isAuthenticated,
  onCreateGoal,
  onCreateProject,
}: {
  isAuthenticated: boolean
  onCreateGoal: () => void
  onCreateProject: () => void
}): QuickActionsController {
  const { t } = useTranslation()
  const sync = usePlayerDataSyncStatus()
  const { hasPageTour, isRunning, startPageTour } = useTour()
  const { open: openFeedback, isReady: feedbackReady } = useUserJot()

  const entries: { action: QuickAction; run: () => void }[] = []
  if (isAuthenticated) {
    entries.push(
      {
        action: {
          id: "createGoal",
          icon: PlusCircle,
          label: t("nav.createGoal"),
          description: t("nav.quickActions.createGoalDescription"),
          keywords: [],
        },
        run: onCreateGoal,
      },
      {
        action: {
          id: "createProject",
          icon: FolderPlus,
          label: t("goals.project.newProject"),
          description: t("nav.quickActions.createProjectDescription"),
          keywords: [],
        },
        run: onCreateProject,
      },
      {
        action: {
          id: "sync",
          icon: RefreshCw,
          label: t("nav.syncWithTacticus"),
          description: t("nav.quickActions.syncDescription"),
          keywords: ["api"],
          disabledReason: sync.isSyncing ? sync.statusText : undefined,
        },
        run: () => void sync.syncNow(),
      }
    )
  }
  entries.push({
    action: {
      id: "feedback",
      icon: MessageSquareText,
      label: t("nav.quickActions.feedbackLabel"),
      description: t("nav.quickActions.feedbackDescription"),
      keywords: [],
      disabledReason: feedbackReady
        ? undefined
        : t("nav.quickActions.feedbackUnavailable"),
    },
    run: () => openFeedback(),
  })
  if (hasPageTour) {
    entries.push({
      action: {
        id: "tourPage",
        icon: HelpCircle,
        label: t("tour.startPage"),
        description: t("nav.quickActions.tourDescription"),
        keywords: [],
        disabledReason: isRunning
          ? t("nav.quickActions.tourRunning")
          : undefined,
      },
      run: startPageTour,
    })
  }

  const latest = useRef(entries)
  useEffect(() => {
    latest.current = entries
  })
  const pending = useRef<QuickActionId | null>(null)
  const enabledEntry = (id: QuickActionId) => {
    const entry = latest.current.find((candidate) => candidate.action.id === id)
    return entry && entry.action.disabledReason === undefined ? entry : null
  }

  return {
    actions: entries.map((entry) => entry.action),
    select: (id) => {
      if (!enabledEntry(id)) return false
      pending.current = id
      return true
    },
    flush: () => {
      const id = pending.current
      pending.current = null
      if (id) enabledEntry(id)?.run()
    },
  }
}
