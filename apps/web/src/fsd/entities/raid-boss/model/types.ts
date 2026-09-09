import type {
  GameCatalogRaidBoss,
  GameCatalogRaidBossSeason,
  GameCatalogRaidBosses,
} from "@workspace/game-catalog"

// Structural re-exports so page/feature code depends on the entity slice, not the package directly.
export type RaidBoss = GameCatalogRaidBoss
export type RaidBossSeason = GameCatalogRaidBossSeason
export type RaidBossesPayload = GameCatalogRaidBosses
export type RaidBossStatStep = RaidBoss["statProgression"][number]
export type RaidBossEncounter =
  RaidBossSeason["tiers"][number]["sets"][number]["encounters"][number]
export type RaidBossEncounterModifier = RaidBossEncounter["modifiers"][number]

export type RaidBossKind = RaidBoss["kind"]

/** A boss/prime with its resolved display label, ready for the list and detail views. */
export type RaidBossListItem = {
  unitSetId: string
  kind: RaidBossKind
  isPrimarch: boolean
  factionId: string
  name: string
}

/** One prime a boss is fought alongside, with its label and scaled modifier list. */
export type RaidBossPrimeModifiers = {
  unitSetId: string
  name: string
  modifiers: RaidBossEncounterModifier[]
}

/**
 * The modifier detail shown for the selected unit at the viewed step: a boss shows its set's primes
 * and their modifiers; a prime shows its own; `none` when the unit has no encounter data.
 */
export type ModifierContext =
  | { kind: "boss"; primes: RaidBossPrimeModifiers[] }
  | { kind: "prime"; modifiers: RaidBossEncounterModifier[] }
  | { kind: "none" }

/** One prime's panel in the adjusted-stats view: its modifier schedule rescaled to its own HP. */
export type AdjustedPrimePanel = {
  /** Stable per-panel id — the containing set's `encounterIndex`; the two crystals of a set can
   *  reference the same prime unit-set id, so that cannot be the key. */
  id: string
  unitSetId: string
  totalHp: number
  scaledModifiers: RaidBossEncounterModifier[]
  /** `0` (full HP) plus each rescaled threshold — the HP-lost selector's options. */
  hpLostPoints: number[]
}

/** The boss's stats/abilities/enemies as adjusted by the modifiers active at the chosen HP-lost points. */
export type AdjustedStatsView = {
  primes: AdjustedPrimePanel[]
  /** The union of modifiers active across all prime panels at their selected HP-lost points. */
  activeModifiers: RaidBossEncounterModifier[]
  statAdjustments: {
    pctByStat: Record<string, number>
    flatByStat: Record<string, number>
  }
  enemies: {
    ids: string[]
    removed: { unitSetId: string; count: number }[]
  }
}
