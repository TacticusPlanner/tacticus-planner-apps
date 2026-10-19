import type { HordeModeTierList } from "./horde-tier-list"

/** A character's horde-mode strategy text from the `hordeStrategy` locale namespace (keyed by
 *  unit id). Each field is absent when the namespace has no text for it. */
export interface HordeStrategyText {
  strengths?: string
  howToUse?: string
  relicAdvice?: string
}

const STRATEGY_FIELDS = ["strengths", "howToUse", "relicAdvice"] as const

/** The non-blank string fields of one `hordeStrategy` entry; anything else is ignored. */
export function parseHordeStrategyText(value: unknown): HordeStrategyText {
  if (typeof value !== "object" || value === null) return {}
  const entry = value as Record<string, unknown>
  const text: HordeStrategyText = {}
  for (const field of STRATEGY_FIELDS) {
    const fieldValue = entry[field]
    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
      text[field] = fieldValue
    }
  }
  return text
}

/** `text` with each missing field taken from `fallback` (the English entry). */
export function withStrategyFallback(
  text: HordeStrategyText,
  fallback: HordeStrategyText
): HordeStrategyText {
  return { ...fallback, ...text }
}

/**
 * A character's recommended teammates from the tier list, in served order (best first). The first
 * entry for a unit id wins, as for its tier; the character itself and repeats are dropped.
 */
export function hordeSynergies(
  tierList: HordeModeTierList | null,
  unitId: string
): readonly string[] {
  const entry = tierList?.characters.find(
    (character) => character.unitId === unitId
  )
  return [...new Set(entry?.synergies ?? [])].filter((id) => id !== unitId)
}

/** What a tile's Strategy section shows; null when there is nothing to show (no section). */
export interface HordeStrategy extends HordeStrategyText {
  teammates: readonly string[]
}

export function hordeStrategy(
  text: HordeStrategyText,
  teammates: readonly string[]
): HordeStrategy | null {
  const hasText = STRATEGY_FIELDS.some((field) => text[field] !== undefined)
  if (!hasText && teammates.length === 0) return null
  return { ...text, teammates }
}
