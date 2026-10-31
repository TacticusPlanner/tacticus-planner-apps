import { createElement, useEffect, useRef } from "react"
import {
  HelpCircle,
  LogIn,
  MessageSquareText,
  PlusCircle,
  FolderPlus,
  RefreshCw,
  UserPlus,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { useSignInRedirect } from "@/shared/auth"
import { usePlayerDataStatus } from "@/shared/player-data-status"
import { useTour } from "@/shared/tour"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
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
  // Status only: the shell hosts this hook, so it must not re-render on every sync progress tick.
  // The disabled row's text reads progress itself through SyncStatusText.
  const sync = usePlayerDataStatus()
  const { hasPageTour, isRunning, startPageTour } = useTour()
  const { open: openFeedback, status: feedbackStatus } = useUserJot()
  const signInRedirect = useSignInRedirect()

  const entries: { action: QuickAction; run: () => void }[] = []
  if (!isAuthenticated) {
    // A guest's navigation lists only the public sections, so these say what an account opens up.
    const busy = signInRedirect.disabled
      ? t("nav.quickActions.signInBusy")
      : undefined
    entries.push(
      {
        action: {
          id: "signIn",
          icon: LogIn,
          label: t("auth.signIn"),
          description: t("nav.quickActions.signInDescription"),
          keywords: ["log in", "account", "goals", "dailies", "guild"],
          disabledReason: busy,
        },
        run: signInRedirect.signIn,
      },
      {
        action: {
          id: "signUp",
          icon: UserPlus,
          label: t("auth.signUp"),
          description: t("nav.quickActions.signUpDescription"),
          keywords: ["register", "create account"],
          disabledReason: busy,
        },
        run: signInRedirect.signUp,
      }
    )
  }
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
          disabledReason:
            sync.status === "syncing"
              ? createElement(SyncStatusText)
              : undefined,
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
      disabledReason:
        feedbackStatus === "failed"
          ? t("nav.quickActions.feedbackUnavailable")
          : undefined,
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

function SyncStatusText() {
  return usePlayerDataSyncStatus().statusText
}
