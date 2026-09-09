import type { RaidBossEncounterModifier } from "../model/types"
import { unitDisplayName } from "./unit-name"

/** Splits a camelCase / PascalCase identifier into space-separated words. */
export function humanizeToken(token: string): string {
  return token
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
}

// Modifier `type` values seen in the datamine (see V1 guild-boss-modifiers.ts). Only two express a
// plain percentage of a game stat (`amount` is a whole-number percent, e.g. 15 -> "−15%"); one is a
// flat stat delta (`amount` is the literal value, e.g. 1 -> "−1 movement"). Every other type scales an
// ability's internal variables/constants by an `amount` that is meaningless without the full modifier
// math (tracked separately) — those render as a direction + target only.
const STAT_PERCENT_TYPES = new Set([
  "bossStatPctDecrease",
  "unitStatPctDecrease",
])
const FLAT_STAT_TYPES = new Set(["bossStatDecrease"])

const DIRECTION: Record<string, "up" | "down"> = {
  bossStatDecrease: "down",
  bossStatPctDecrease: "down",
  bossAbilityAllStatsPctDecrease: "down",
  bossAbilityConstantDecrease: "down",
  unitStatPctDecrease: "down",
  bossAbilityConstantIncrease: "up",
  unitAmountDecrease: "down",
  bossAbilityVariableIncrease: "up",
  bossAbilityVariableDecrease: "down",
  bossAbilityVariablePctDecrease: "down",
}

/** The thing a modifier acts on, as a readable label — a raw `GuildBoss…` unit id is name-resolved. */
function targetLabel(modifier: RaidBossEncounterModifier): string {
  const raw = modifier.subtarget ?? modifier.target
  return /^GuildBoss\d+/.test(raw) ? unitDisplayName(raw) : humanizeToken(raw)
}

/**
 * A modifier rendered for display. `amount` variants carry a fully-formed magnitude string; `effect`
 * variants only know a direction + target and are wrapped in UI copy by the caller (so "reduces" /
 * "increases" stay translatable).
 */
export type ModifierDescription =
  | { kind: "amount"; text: string }
  | { kind: "effect"; direction: "reduces" | "increases"; label: string }

export function describeModifier(
  modifier: RaidBossEncounterModifier
): ModifierDescription {
  const label = targetLabel(modifier)
  const magnitude = Math.abs(modifier.amount)

  if (STAT_PERCENT_TYPES.has(modifier.type)) {
    return { kind: "amount", text: `−${magnitude}% ${label}` }
  }
  if (FLAT_STAT_TYPES.has(modifier.type)) {
    return { kind: "amount", text: `−${magnitude} ${label}` }
  }
  return {
    kind: "effect",
    direction: DIRECTION[modifier.type] === "up" ? "increases" : "reduces",
    label,
  }
}
