import type { HreObjective, HreObjectiveKind } from "@/entities/hre-mission"

/**
 * The objective kinds with a tip of our own, beside the game's hint. A tip says what the game's hint
 * doesn't: which units or nodes help. Kinds whose game hint already says it (campaign wins, damage
 * type, featured damage, alliance and featured ability uses, summon-free wins, alliance lineups) have
 * none (Severyn, 2026-11); nor do the token kinds.
 */
const TIP_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "campaignRaids",
  "lightningVictories",
  "killEnemies",
  "killWithMelee",
  "killWithRanged",
  "killWithAlliance",
  "killFaction",
  "damage",
  "abilityDamage",
  "useAbilities",
  "heal",
])

/** Kill kinds: summons count as kills, so they also get the summons tip (Severyn, 2026-11). */
const KILL_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "killEnemies",
  "killWithMelee",
  "killWithRanged",
  "killWithAlliance",
  "killFaction",
])

/** The `hre:tips.*` keys for an objective kind, in the order shown; empty when it has none. */
export function objectiveTipKeys(kind: HreObjectiveKind): string[] {
  if (!TIP_KINDS.has(kind)) return []
  return KILL_KINDS.has(kind) ? [kind, "killSummons"] : [kind]
}

const hasObjectiveTip = (kind: HreObjectiveKind) => TIP_KINDS.has(kind)

/** Whether an objective has a game hint or a tip of ours to show. */
export const hasGuidance = (
  objective: HreObjective,
  hint: string | undefined
) => !!hint || hasObjectiveTip(objective.kind)
