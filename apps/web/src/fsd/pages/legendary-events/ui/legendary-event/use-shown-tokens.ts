import { useCallback, useEffect } from "react"

import type { LegendaryEventProgress } from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { safeStorage, storageKeys } from "@/shared/lib"

import {
  forgetShownToken,
  rememberShownToken,
  settleShownTokens,
  tokenClearedEvent,
} from "./token-cleared-analytics"
import type { ShownToken } from "./token-cleared-analytics"
import type { ReadValue } from "./legendary-event-page.view-model"

// One record for every event, `{ [eventId]: ShownToken[] }`, under the account prefix.
const STORAGE_KEY = storageKeys.userLegendaryEventShownTokens
// Events with tokens still waiting to be reported; the oldest beyond this are dropped so the
// record cannot grow with every event the account ever opened.
const MAX_EVENTS_WITH_SHOWN_TOKENS = 10

type ShownTokensByEvent = Record<string, ShownToken[]>

function loadAll(): ShownTokensByEvent {
  const raw = safeStorage.get(STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as ShownTokensByEvent)
      : {}
  } catch {
    return {}
  }
}

function load(eventId: string): ShownToken[] {
  const tokens = loadAll()[eventId]
  return Array.isArray(tokens) ? tokens : []
}

function save(eventId: string, tokens: readonly ShownToken[]): void {
  const others = Object.fromEntries(
    Object.entries(loadAll()).filter(([id]) => id !== eventId)
  )
  // Re-inserted last, so the record's key order runs from least to most recently written.
  const all =
    tokens.length === 0 ? others : { ...others, [eventId]: [...tokens] }
  const kept = Object.entries(all).slice(-MAX_EVENTS_WITH_SHOWN_TOKENS)
  if (kept.length === 0) safeStorage.remove(STORAGE_KEY)
  else safeStorage.set(STORAGE_KEY, JSON.stringify(Object.fromEntries(kept)))
}

/**
 * Remembers the Next tokens the card shows (per account and event, in local storage) and sends
 * `legendary_event_token_cleared` once synced progress shows one cleared; `forget` drops a token a
 * card action reported as falling short.
 */
export function useShownTokens(
  eventId: string,
  run: number | null,
  progress: ReadValue<LegendaryEventProgress | undefined>
) {
  const { captureEvent, isReady } = useAnalyticsActions()
  useEffect(() => {
    if (progress === "loading" || progress === "error") return
    const tokens = load(eventId)
    if (tokens.length === 0) return
    if (!isReady) {
      // A capture before the SDK loads is dropped: keep this run's tokens until it can be sent.
      const current = tokens.filter((token) => token.run === run)
      if (current.length !== tokens.length) save(eventId, current)
      return
    }
    const { cleared, kept } = settleShownTokens(tokens, progress, run)
    for (const token of cleared) {
      captureEvent(tokenClearedEvent(eventId, token))
    }
    if (kept.length !== tokens.length) save(eventId, kept)
  }, [captureEvent, eventId, isReady, progress, run])
  const remember = useCallback(
    (token: ShownToken) =>
      save(eventId, rememberShownToken(load(eventId), token)),
    [eventId]
  )
  const forget = useCallback(
    (battle: Pick<ShownToken, "laneId" | "battleIndex">) =>
      save(eventId, forgetShownToken(load(eventId), battle)),
    [eventId]
  )
  return { remember, forget }
}
