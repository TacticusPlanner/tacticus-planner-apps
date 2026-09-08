import type { RaidBossEncounterModifier } from "../model/types"

/** Splits a camelCase / PascalCase identifier into space-separated words. */
export function humanizeToken(token: string): string {
  return token
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
}

// Modifier `type` values seen in the datamine (see V1 guild-boss-modifiers.ts). `pct` variants express
// `amount` as a fraction; the rest are flat amounts. This produces a readable one-line description; it
// does NOT compute the adjusted stat/ability values (that math port is tracked separately).
const PERCENT_TYPES = new Set([
  "bossStatPctDecrease",
  "bossAbilityAllStatsPctDecrease",
  "unitStatPctDecrease",
  "bossAbilityVariablePctDecrease",
])

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

export function formatModifierAmount(
  modifier: RaidBossEncounterModifier
): string {
  const magnitude = PERCENT_TYPES.has(modifier.type)
    ? `${Math.round(Math.abs(modifier.amount) * 100)}%`
    : `${Math.abs(modifier.amount)}`
  const sign = DIRECTION[modifier.type] === "up" ? "+" : "−"
  return `${sign}${magnitude}`
}

export function describeModifier(modifier: RaidBossEncounterModifier): string {
  const target = humanizeToken(modifier.subtarget ?? modifier.target)
  return `${formatModifierAmount(modifier)} ${target}`.trim()
}
