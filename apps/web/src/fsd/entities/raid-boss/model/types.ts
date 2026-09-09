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
