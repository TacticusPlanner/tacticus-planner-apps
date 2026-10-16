import { useCallback, useEffect, useRef, useState } from "react"

import type {
  LegendaryEventLaneId,
  LegendaryEventTeam,
} from "@/entities/legendary-event"

/** What the team editor opens on (design D4): a lane, plus a saved team to edit, or a new team's
 *  first members (a suggestion's, or the leaderboard unit's). */
interface TeamEditorRequest {
  laneId: LegendaryEventLaneId
  team?: LegendaryEventTeam
  memberUnitIds?: readonly string[]
  /** The 1-based rank of the team suggestion the editor starts from. */
  suggestionRank?: number
}

/** The open editor: the request with a fresh mount key, so each opening starts from its draft. */
type OpenTeamEditor = TeamEditorRequest & { key: number }

export interface TeamEditorLauncher {
  /** The open editor, or null. */
  editor: OpenTeamEditor | null
  openTeamEditor: (request: TeamEditorRequest) => void
  closeTeamEditor: () => void
}

/**
 * The element focus returns to when the editor closes: the opener, or — when the editor was opened
 * from a menu item, which unmounts with its menu — the button that opened that menu.
 */
function focusReturnTarget(active: Element | null): HTMLElement | null {
  if (!(active instanceof HTMLElement)) return null
  const menu = active.closest('[role="menu"]')
  if (menu?.id) {
    const trigger = document.querySelector(
      `[aria-controls="${CSS.escape(menu.id)}"]`
    )
    return trigger instanceof HTMLElement ? trigger : null
  }
  return active
}

/**
 * The page-level team editor's state (design D4): one editor for the event page, opened by the
 * Teams section (Add team, Edit, Use this team) and the leaderboards (Add to new team). Closing
 * returns focus to the opener once the dialog has unmounted.
 */
export function useTeamEditorLauncher(): TeamEditorLauncher {
  const [editor, setEditor] = useState<OpenTeamEditor | null>(null)
  const count = useRef(0)
  const opener = useRef<HTMLElement | null>(null)

  const openTeamEditor = useCallback((request: TeamEditorRequest) => {
    opener.current = focusReturnTarget(document.activeElement)
    count.current += 1
    setEditor({ ...request, key: count.current })
  }, [])
  const closeTeamEditor = useCallback(() => setEditor(null), [])

  // Focus goes back to the opener after the dialog's own focus scope has let go: its unmount
  // schedules a focus restore of its own, so this one runs in a later task.
  useEffect(() => {
    if (editor || !opener.current) return
    const target = opener.current
    opener.current = null
    const timer = setTimeout(() => {
      if (target.isConnected) target.focus()
    })
    return () => clearTimeout(timer)
  }, [editor])

  return { editor, openTeamEditor, closeTeamEditor }
}
