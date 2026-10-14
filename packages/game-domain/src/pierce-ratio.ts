// The share of a hit's damage that still lands through infinite armour, by damage type: the floor a
// hit can never be mitigated below, however high the target's armour. Values follow the Tacticus wiki's
// "Damage Types and Pierce Ratio" table (https://tacticus.wiki.gg/wiki/Damage_Types_and_Pierce_Ratio),
// which corrects V1's `getPierceRatio` for Chain (20%, not 15%) and Plasma (65%, not 60%). The wiki's
// Las bonus (+50% for Emplacement or Heavy Weapon units) is unit-specific and not modelled here. Keys
// are the catalog's damage type strings; "Heavy Round" and "Molecular" are V1's display spellings of
// the catalog's "HeavyRound" and "Gauss".
const pierceRatioByDamageType: Readonly<Record<string, number>> = {
  Bio: 0.3,
  Blast: 0.15,
  Bolter: 0.2,
  Chain: 0.2,
  Direct: 1,
  Energy: 0.3,
  Eviscerate: 0.5,
  Flame: 0.25,
  HeavyRound: 0.55,
  "Heavy Round": 0.55,
  Las: 0.1,
  Melta: 0.75,
  Gauss: 0.6,
  Molecular: 0.6,
  Particle: 0.35,
  Physical: 0.01,
  Piercing: 0.8,
  Plasma: 0.65,
  Power: 0.4,
  Projectile: 0.15,
  Pulse: 0.2,
  Psychic: 1,
  Toxic: 0.7,
}

/** The pierce ratio for a damage type, or `undefined` for a type the table doesn't know. */
export function pierceRatio(damageType: string): number | undefined {
  return pierceRatioByDamageType[damageType]
}
