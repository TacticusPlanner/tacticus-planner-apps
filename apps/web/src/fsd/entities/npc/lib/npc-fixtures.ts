import type { NpcRecord, NpcStatRow } from "../model/types"

/** Test-only builders for served NPC records. */
export function statRow(
  rank: number,
  stars: number,
  health = 100,
  extra: Partial<NpcStatRow> = {}
): NpcStatRow {
  return {
    abilityLevel: 1,
    damage: 10,
    armour: 5,
    health,
    progressionIndex: 0,
    rank,
    stars,
    ...extra,
  }
}

export const zeroRow: NpcStatRow = {
  abilityLevel: 1,
  damage: 0,
  armour: 0,
  health: 0,
  progressionIndex: 0,
  rank: 0,
  stars: 0,
}

export function npcRecord(
  id: string,
  name: string,
  overrides: Partial<NpcRecord> = {}
): NpcRecord {
  return {
    id,
    name,
    factionId: "Necrons",
    alliance: "Xenos",
    kind: "unit",
    meleeDamage: "Physical",
    meleeHits: 1,
    rangedDamage: null,
    rangedHits: null,
    distance: null,
    movement: 3,
    traits: [],
    activeAbilityDamage: [],
    activeAbilities: [],
    passiveAbilityDamage: [],
    passiveAbilities: [],
    stats: [statRow(0, 0)],
    ...overrides,
  }
}

/** Makhotep as served: five variations with distinct ladders. */
export const makhotepRecords: NpcRecord[] = [
  npcRecord("necroNpcWarden", "Makhotep", {
    rangedDamage: "Gauss",
    rangedHits: 2,
    distance: 3,
    traits: ["LivingMetal", "Mechanical"],
    stats: [statRow(1, 1, 117), statRow(2, 1, 130), statRow(19, 12, 9000)],
  }),
  npcRecord("necroBossWarden", "Makhotep", {
    rangedDamage: "Gauss",
    rangedHits: 2,
    distance: 3,
    traits: ["LivingMetal", "Mechanical"],
    // Served out of progression order on purpose (rank 2 before rank 1).
    stats: [statRow(2, 2, 160), statRow(1, 2, 140), statRow(9, 6, 1028)],
  }),
  npcRecord("necroBossWardenLHE", "Makhotep", {
    rangedDamage: "Gauss",
    rangedHits: 2,
    distance: 3,
    traits: ["LivingMetal", "Mechanical"],
    stats: [statRow(3, 2, 200), statRow(18, 13, 8000)],
  }),
  npcRecord("necroBossWardenLEG", "Makhotep", {
    rangedDamage: "Gauss",
    rangedHits: 2,
    distance: 3,
    traits: ["LivingMetal", "Mechanical"],
    stats: [statRow(11, 10, 2014), statRow(14, 11, 4000)],
  }),
  npcRecord("necroBossC1Warden", "Makhotep", {
    rangedDamage: "Gauss",
    rangedHits: 2,
    distance: 3,
    traits: ["LivingMetal", "Mechanical"],
    stats: [statRow(2, 2, 160), statRow(9, 6, 1028)],
  }),
]
