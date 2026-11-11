import type {
  LegendaryEventLaneId,
  LegendaryEventProgress,
} from "@/entities/legendary-event"
import {
  estimateSnapshot,
  type DepthEstimateContext,
} from "@/features/legendary-event-plan"
import type { AnalyticsEvent } from "@/shared/analytics"

import type { TokenBattleSnapshot } from "./token-result-analytics"

/**
 * A Next token the card showed, remembered until sync shows it cleared (then
 * `legendary_event_token_cleared` is sent) or a card action reports it fell short (then it is
 * dropped: `legendary_event_token_result` covers it). The estimate is the one shown at the time.
 */
export interface ShownToken {
  run: number | null
  laneId: LegendaryEventLaneId
  /** 0-based. */
  battleIndex: number
  teamId: string
  /** Cell ids the token clears: 0 defeat-all, `index + 1` an objective. */
  clearedIds: number[]
  depth: number | null
  depthManual: boolean
  shown: DepthEstimateContext
  battle: TokenBattleSnapshot
}

/** At most this many shown tokens are remembered per event (oldest dropped first). */
const MAX_SHOWN_TOKENS = 12

function sameBattle(
  a: Pick<ShownToken, "laneId" | "battleIndex">,
  b: Pick<ShownToken, "laneId" | "battleIndex">
): boolean {
  return a.laneId === b.laneId && a.battleIndex === b.battleIndex
}

/** The remembered tokens with `token` added (replacing one for the same battle). */
export function rememberShownToken(
  tokens: readonly ShownToken[],
  token: ShownToken
): ShownToken[] {
  return [...tokens.filter((entry) => !sameBattle(entry, token)), token].slice(
    -MAX_SHOWN_TOKENS
  )
}

/** The remembered tokens without the one for this battle (a card action reported it). */
export function forgetShownToken(
  tokens: readonly ShownToken[],
  battle: Pick<ShownToken, "laneId" | "battleIndex">
): ShownToken[] {
  return tokens.filter((entry) => !sameBattle(entry, battle))
}

/**
 * Splits the remembered tokens by synced progress: `cleared` has every cell it planned to clear
 * cleared in sync; tokens of another run are dropped; the rest are kept for a later sync.
 */
export function settleShownTokens(
  tokens: readonly ShownToken[],
  progress: LegendaryEventProgress | undefined,
  run: number | null
): { cleared: ShownToken[]; kept: ShownToken[] } {
  const cleared: ShownToken[] = []
  const kept: ShownToken[] = []
  for (const token of tokens) {
    if (token.run !== run) continue
    const done = new Set(
      progress?.[token.laneId]?.encounters?.[token.battleIndex]
        ?.objectivesCleared ?? []
    )
    if (
      token.clearedIds.length > 0 &&
      token.clearedIds.every((id) => done.has(id))
    ) {
      cleared.push(token)
    } else {
      kept.push(token)
    }
  }
  return { cleared, kept }
}

/** The `legendary_event_token_cleared` event of a remembered token sync shows cleared. */
export function tokenClearedEvent(
  eventId: string,
  token: ShownToken
): Extract<AnalyticsEvent, { type: "legendary_event_token_cleared" }> {
  return {
    type: "legendary_event_token_cleared",
    eventId,
    run: token.run,
    laneId: token.laneId,
    battleIndex: token.battleIndex,
    estimate: token.shown.estimate,
    depth: token.depth,
    depthManual: token.depthManual,
    ...estimateSnapshot(token.shown),
    ...token.battle,
  }
}
