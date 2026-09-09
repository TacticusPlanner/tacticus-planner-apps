// One-off generator for the English raid-boss game-data i18n namespaces, keyed by entity id:
//   public/locales/en/raidBosses.json         unitSetId -> display name
//   public/locales/en/raidBossAbilities.json  abilityId -> ability name (referenced ids only)
//   public/locales/en/raidBossTraits.json     traitId   -> trait name (referenced ids only)
//   public/locales/en/raidBossAbilityText.json abilityId -> { description, variables, constants, scaled }
//   public/locales/en/raidBossTraitText.json  traitId   -> { description, styledName, variables }
//
// Source: tacticusplanner (develop) datamine. Other locales fall back to en (i18next fallbackLng),
// matching the existing `traits`/`characters` game-data namespaces which are en-only. Re-run on a
// game-version refresh. Names are derived with V1's own `getUnitDisplayName` formatting; ability/trait
// rules-text carries `{[variable]}` tokens the client resolves per progression step (see the
// `add-raid-boss-ability-text` OpenSpec change).
import { readFileSync, writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const v1 = resolve(here, "../../../../tacticusplanner/src/fsd/4-entities")
const outDir = resolve(here, "../public/locales/en")

const guildBoss = JSON.parse(
  readFileSync(`${v1}/guild_boss/data/guild_boss.json`, "utf8")
)
const abilityData = JSON.parse(
  readFileSync(`${v1}/abilities/data/new-ability-data.json`, "utf8")
)
const traitData = JSON.parse(
  readFileSync(`${v1}/traits/data/new-traits-data.json`, "utf8")
)

// Ported verbatim from V1 `4-entities/traits/trait-variables.ts`. Trait descriptions carry
// `{[varName]}` placeholders whose values come from these global game constants (traits do not level,
// so each resolves to a single-element array). Build-time only — kept here so shipped app code reads
// already-resolved values.
const TRAIT_GLOBAL_VARIABLES = {
  livingMetalHp: 10,
  heavyWeaponExtraDmg: 25,
  damagedMachineDestroyChanceIncrease: 50,
  psykerExtraDmg: 50,
  emplacementMeleeDmgModifier: -50,
  emplacementRangedDmgModifier: 50,
  deathToTheFalseEmperorExtraHitChance: 33,
  actOfFaithExtraCritChance: 10,
  actOfFaithExtraCritDmgPct: 25,
  battleFatigueChance: 10,
  battleFatigueChance_2: 40,
  terrifyingDefensePct: -30,
  daemonBlockChance: 25,
  daemonBlockDamagePercentage: 50,
  shadowInTheWarpDmgModifier: -25,
  shadowInTheWarpRange: 2,
  putridExplosionDmgPct: 25,
  putridExplosionFactionId: "DeathGuard",
  putridExplosionDamageProfile: "Toxic",
  contagionsOfNurgleArmorOneAura: -20,
  contagionsOfNurgleArmorTwoOrMoreAuras: -40,
  parryHitReduction: 1,
  diminutiveHitReduction: 1,
  dakkaExtraHits: 2,
  beastSnaggaDmgBonus: 20,
  beastSnaggaBlockChance: 10,
  beastSnaggaDmgAsMaxHpPct: 20,
  beastSlayerExtraDmgPct: 20,
  beastSlayerBlockChance: 10,
  beastSlayerBlockAsMaxArmorPct: 100,
  closeCombatWeaknessMeleeDmgPctReduction: -50,
  closeCombatWeaknessRangeDmgPctReduction: -25,
  camouflageHitReduction_1: 1,
  camouflageHitReduction_2: 2,
  camouflageHitReduction_3: 3,
  terminatorArmourDmgReduction: -75,
  terminatorArmourExcludedDmgProfiles: "Psychic,DirectDamage",
  bossAdjutantDmgReductionPct: 66,
  bossAdjutantDmgPct: 1,
  crushingStrikeExtraDmgPct: 50,
  rapidAssaultExtraDmgPct: 25,
  blessingsOfKhorneExtraDmgPct: 3,
  blessingsOfKhorneDmgPctReduction: 8,
  blessingsOfKhorneMaxDefeatedUnits: 8,
  getStuckInChance: 30,
  getStuckInChance_2: 100,
  ambushUnitToSpawn: "genesSmnDecoy",
  martialKatahDmgReductionPct: 20,
  martialKatahExtraDmgPct: 100,
  thrillSeekersNrOfRounds: 1,
  thrillSeekersExtraCritChance: 15,
  LetTheGalaxyBurnChancePct: 33,
  prioritisedEfficiencyExtraDmgPct: 25,
  prioritisedEfficiencyDmgReductionPct: 33,
  rangedSpecialistDmgPct: 33,
}

const TRAIT_VARIABLE_MAP = {
  ActOfFaith: {
    extraCritChance: "actOfFaithExtraCritChance",
    extraCritDmgPct: "actOfFaithExtraCritDmgPct",
  },
  BattleFatigue: {
    chance: "battleFatigueChance",
    chance_2: "battleFatigueChance_2",
  },
  BeastSlayer: {
    extraDmgPct: "beastSlayerExtraDmgPct",
    blockChance: "beastSlayerBlockChance",
  },
  BeastSnagga: {
    extraDmgPct: "beastSnaggaDmgBonus",
    blockChance: "beastSnaggaBlockChance",
    blockDmgPct: "beastSnaggaDmgAsMaxHpPct",
  },
  BlessingsOfKhorne: {
    extraDmgPct: "blessingsOfKhorneExtraDmgPct",
    dmgPctReduction: "blessingsOfKhorneDmgPctReduction",
    nrOfHeroes: "blessingsOfKhorneMaxDefeatedUnits",
  },
  BossAdjutant: {
    damagePctReduction: "bossAdjutantDmgReductionPct",
    damagePct: "bossAdjutantDmgPct",
  },
  CloseCombatWeakness: {
    dmgPctReduction: "closeCombatWeaknessMeleeDmgPctReduction",
    dmgPctReduction_2: "closeCombatWeaknessRangeDmgPctReduction",
  },
  ContagionsOfNurgle: {
    armorReduction: "contagionsOfNurgleArmorOneAura",
    armorReduction2: "contagionsOfNurgleArmorTwoOrMoreAuras",
  },
  CrushingStrike: { extraDmgPct: "crushingStrikeExtraDmgPct" },
  Daemon: {
    blockChance: "daemonBlockChance",
    blockDmgPct: "daemonBlockDamagePercentage",
  },
  Dakka: { extraHit: "dakkaExtraHits" },
  Diminutive: { hitsReduction: "diminutiveHitReduction" },
  Emplacement: {
    damageModifier: "emplacementMeleeDmgModifier",
    damageModifier_2: "emplacementRangedDmgModifier",
  },
  GetStuckIn: {
    chance: "getStuckInChance",
    chance_2: "getStuckInChance_2",
  },
  HeavyWeapon: { extraDmgPct: "heavyWeaponExtraDmg" },
  LetTheGalaxyBurn: { chance: "LetTheGalaxyBurnChancePct" },
  LivingMetal: { hpPct: "livingMetalHp" },
  MartialKatah: {
    dmgReductionPct: "martialKatahDmgReductionPct",
    extraDmgPct: "martialKatahExtraDmgPct",
  },
  Parry: { hitsReduction: "parryHitReduction" },
  PrioritisedEfficiency: {
    extraDmgPct: "prioritisedEfficiencyExtraDmgPct",
    dmgReductionPct: "prioritisedEfficiencyDmgReductionPct",
  },
  Psyker: { extraDmgPct: "psykerExtraDmg" },
  PutridExplosion: { extraDmgPct: "putridExplosionDmgPct" },
  RangedSpecialist: { extraDmgPct: "rangedSpecialistDmgPct" },
  RapidAssault: { extraDmgPct: "rapidAssaultExtraDmgPct" },
  ShadowInTheWarp: {
    range: "shadowInTheWarpRange",
    dmgPct: "shadowInTheWarpDmgModifier",
  },
  TerminatorArmour: { dmgPctReduction: "terminatorArmourDmgReduction" },
  Terrifying: { defensePct: "terrifyingDefensePct" },
  ThrillSeekers: {
    nrOfRounds: "thrillSeekersNrOfRounds",
    extraCritChance: "thrillSeekersExtraCritChance",
  },
}

function getTraitVariables(traitId) {
  const map = TRAIT_VARIABLE_MAP[traitId]
  if (!map) return {}
  return Object.fromEntries(
    Object.entries(map).map(([variableName, globalKey]) => [
      variableName,
      [TRAIT_GLOBAL_VARIABLES[globalKey]],
    ])
  )
}

const FACTION_PREFIXES = [
  "Tyran",
  "Necro",
  "Death",
  "Orks",
  "Astra",
  "Eldar",
  "Thous",
  "Admec",
  "Tau",
  "Darka",
]
const UNIT_TYPE_RE = /^GuildBoss\d+(?:Boss|MiniBoss|Minion|Npc|LootObj)\d*/

function formatWords(name) {
  return name
    .replace(/([a-z])(of|the)([A-Z])/g, "$1 $2 $3")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim()
}

// Ported from V1 guild-boss.service.ts getUnitDisplayName.
function unitDisplayName(unitSetId) {
  let name = unitSetId.replace(UNIT_TYPE_RE, "")
  for (const faction of FACTION_PREFIXES) {
    if (name.startsWith(faction)) {
      name = name.slice(faction.length)
      break
    }
  }
  return formatWords(name || unitSetId)
}

const BOSS_RE = /^GuildBoss(\d+)Boss/
const PRIME_RE = /^GuildBoss(\d+)(?:MiniBoss|Minion)(\d+)/

const raidBosses = {}
const referencedAbilityIds = new Set()
const referencedTraitIds = new Set()

for (const [id, unitSet] of Object.entries(guildBoss.unitSets)) {
  if (!BOSS_RE.test(id) && !PRIME_RE.test(id)) continue
  raidBosses[id] = unitDisplayName(id)
  for (const abilityId of [
    ...(unitSet.activeAbilities ?? []),
    ...(unitSet.passiveAbilities ?? []),
    ...(unitSet.relicAbilities ?? []),
  ]) {
    referencedAbilityIds.add(abilityId)
  }
  for (const traitId of unitSet.traits ?? []) referencedTraitIds.add(traitId)
}

const abilityById = new Map(abilityData.map((a) => [a.id, a]))
const traitById = new Map(traitData.map((t) => [t.id, t]))

// Abilities: keep a readable label for every referenced id (falling back to a formatted token when
// the datamine has no name), then let the page hide the handful of internal ids via its own set.
const raidBossAbilities = {}
for (const abilityId of [...referencedAbilityIds].sort()) {
  const name = abilityById.get(abilityId)?.text?.name
  raidBossAbilities[abilityId] = name || formatWords(abilityId)
}

// Traits: emit an entry ONLY when the id resolves to a real game trait. An unresolved id (e.g. the
// `Boss` pseudo-trait) is dropped so the page can skip it, matching V1's `if (!trait) return`.
const raidBossTraits = {}
for (const traitId of [...referencedTraitIds].sort()) {
  const name = traitById.get(traitId)?.name
  if (name) raidBossTraits[traitId] = name
}

// Ability rules-text: for every referenced ability that has a real, non-placeholder description,
// carry the text plus the per-level variable/constant tables and the rarity-scaled variable names.
// `nrOfHits` etc. are resolved client-side per the selected progression step's ability level.
const PLACEHOLDER_DESCRIPTIONS = new Set(["", "Coming soon!"])
const raidBossAbilityText = {}
for (const abilityId of [...referencedAbilityIds].sort()) {
  const ability = abilityById.get(abilityId)
  const description = ability?.text?.currentLevelDescription ?? ""
  if (!ability || PLACEHOLDER_DESCRIPTIONS.has(description.trim())) continue
  raidBossAbilityText[abilityId] = {
    description,
    variables: ability.variables ?? {},
    constants: ability.constants ?? {},
    scaled: ability.variablesAffectedByRarityBonus ?? [],
  }
}

// Trait rules-text: the styled name and description, with `{[var]}` placeholders resolved from the
// global trait constants at build time (traits do not level).
const raidBossTraitText = {}
for (const traitId of [...referencedTraitIds].sort()) {
  const trait = traitById.get(traitId)
  if (!trait?.description) continue
  raidBossTraitText[traitId] = {
    description: trait.description,
    styledName: trait.styledName ?? trait.name ?? traitId,
    variables: getTraitVariables(traitId),
  }
}

const sortObject = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))

writeFileSync(
  `${outDir}/raidBosses.json`,
  JSON.stringify(sortObject(raidBosses), null, 2) + "\n"
)
writeFileSync(
  `${outDir}/raidBossAbilities.json`,
  JSON.stringify(raidBossAbilities, null, 2) + "\n"
)
writeFileSync(
  `${outDir}/raidBossTraits.json`,
  JSON.stringify(raidBossTraits, null, 2) + "\n"
)
writeFileSync(
  `${outDir}/raidBossAbilityText.json`,
  JSON.stringify(sortObject(raidBossAbilityText), null, 2) + "\n"
)
writeFileSync(
  `${outDir}/raidBossTraitText.json`,
  JSON.stringify(sortObject(raidBossTraitText), null, 2) + "\n"
)

console.log("raidBosses:", Object.keys(raidBosses).length)
console.log("raidBossAbilities:", Object.keys(raidBossAbilities).length)
console.log("raidBossTraits:", Object.keys(raidBossTraits).length)
console.log("raidBossAbilityText:", Object.keys(raidBossAbilityText).length)
console.log("raidBossTraitText:", Object.keys(raidBossTraitText).length)
