import { useCallback, useMemo, useState } from "react"

import { accountStorageKey, safeStorage } from "@/shared/lib"

import {
  EMPTY_QUEST_PROGRESS,
  fitObjectives,
  parseQuestProgress,
  type QuestProgress,
} from "./quest-progress"
import type { QuestEventStorageModel } from "@workspace/game-catalog"

import {
  EMPTY_BATTLE_ENTRY,
  MAX_MEDALS,
  type QuestBattleEntry,
} from "./quest-score"
import type { QuestTokens } from "./quest-token-plan"

// Design D4: one entry per quest occurrence, per browser. Every storage access is guarded, so a
// private window or blocked site data degrades to in-memory progress, and the tab says so.
// Account data: kept under the account prefix, so sign-out removes it.
const QUEST_PROGRESS_STORAGE_KEY = accountStorageKey(
  "dailies.quest.progress.v1"
)

function readAll(): Record<string, QuestProgress> {
  try {
    const raw = safeStorage.get(QUEST_PROGRESS_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (typeof parsed !== "object" || parsed === null) return {}
    const entries: Record<string, QuestProgress> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const entry = parseQuestProgress(value)
      if (entry) entries[key] = entry
    }
    return entries
  } catch {
    return {}
  }
}

export type QuestProgressActions = {
  setMedals: (battle: number, medals: number) => void
  setLightning: (battle: number, points: number) => void
  setObjective: (battle: number, index: number, ticked: boolean) => void
  setBundle: (bundle: boolean) => void
  /** Records "tokens now" at `atUtc`; null clears the entry. */
  setTokens: (count: number | null, atUtc: string) => void
}

/** The served limits the edits are capped to: the Lightning Victory's maximum and the token bank. */
type QuestProgressLimits = {
  scorePoints: Pick<
    QuestEventStorageModel["scorePoints"],
    "maxPointsForLightningVictory"
  >
  tokens: Pick<QuestEventStorageModel["tokens"], "max">
}

/**
 * The stored progress of one quest occurrence and its edits. `key` null (a preview, or a browsed
 * quest) keeps it empty and read-only, and so do `limits` null (the served quest not read yet).
 * `objectiveCounts` fits each entry's ticks to the served battle. `saveFailed` turns true once a
 * write did not land; the entries still apply this visit.
 */
export function useQuestProgress(
  key: string | null,
  objectiveCounts: ReadonlyMap<number, number>,
  limits: QuestProgressLimits | null
): {
  entries: Record<number, QuestBattleEntry>
  bundle: boolean
  tokens: QuestTokens | null
  actions: QuestProgressActions
  saveFailed: boolean
} {
  const [all, setAll] = useState(readAll)
  const [saveFailed, setSaveFailed] = useState(false)
  const stored = (key && all[key]) || EMPTY_QUEST_PROGRESS

  const entries = useMemo(() => {
    const fitted: Record<number, QuestBattleEntry> = {}
    for (const [number, count] of objectiveCounts) {
      const entry = stored.battles[number]
      if (entry) fitted[number] = fitObjectives(entry, count)
    }
    return fitted
  }, [stored, objectiveCounts])

  const updateProgress = useCallback(
    (change: (current: QuestProgress) => QuestProgress) => {
      if (!key || !limits) return
      const next = {
        ...all,
        [key]: change(all[key] ?? EMPTY_QUEST_PROGRESS),
      }
      setAll(next)
      if (!safeStorage.trySet(QUEST_PROGRESS_STORAGE_KEY, JSON.stringify(next)))
        setSaveFailed(true)
    },
    [all, key, limits]
  )
  const update = useCallback(
    (battle: number, change: (current: QuestBattleEntry) => QuestBattleEntry) =>
      updateProgress((progress) => ({
        ...progress,
        battles: {
          ...progress.battles,
          [battle]: change(
            fitObjectives(
              progress.battles[battle] ?? EMPTY_BATTLE_ENTRY,
              objectiveCounts.get(battle) ?? 0
            )
          ),
        },
      })),
    [updateProgress, objectiveCounts]
  )

  const actions = useMemo(
    (): QuestProgressActions => ({
      setMedals: (battle, medals) =>
        update(battle, (current) => ({
          ...current,
          medals: Math.min(Math.max(Math.round(medals), 0), MAX_MEDALS),
        })),
      setLightning: (battle, points) =>
        update(battle, (current) => ({
          ...current,
          lightning: Math.min(
            Math.max(Math.round(points), 0),
            limits?.scorePoints.maxPointsForLightningVictory ?? 0
          ),
        })),
      setObjective: (battle, index, ticked) =>
        update(battle, (current) => ({
          ...current,
          objectives: current.objectives.map((tick, at) =>
            at === index ? ticked : tick
          ),
        })),
      setBundle: (bundle) =>
        updateProgress((progress) => ({ ...progress, bundle })),
      setTokens: (count, atUtc) =>
        updateProgress((progress) => {
          if (count === null) {
            const next = { ...progress }
            delete next.tokens
            return next
          }
          return {
            ...progress,
            tokens: {
              count: Math.min(
                Math.max(Math.round(count), 0),
                limits?.tokens.max ?? 0
              ),
              atUtc,
            },
          }
        }),
    }),
    [update, updateProgress, limits]
  )
  return {
    entries,
    bundle: stored.bundle === true,
    tokens: stored.tokens ?? null,
    actions,
    saveFailed,
  }
}
