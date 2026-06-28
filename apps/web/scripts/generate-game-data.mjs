// One-off generator for the game-data i18n namespaces + the character icon map.
//
// Source of truth is the embedded game-catalog raw data in the sibling API repo
// (tacticus-planner-api). This script is run by maintainers when that data changes; its OUTPUT is
// committed, so the app build never depends on the API repo being present.
//
//   node scripts/generate-game-data.mjs
//
// Writes:
//   public/locales/en/{characters,upgrades,campaignLocations,ranks}.json  (full English)
//   public/locales/{de,es,fr}/{characters,upgrades,campaignLocations}.json (empty -> fall back to en)
//   public/locales/{de,es,fr}/ranks.json (empty -> fall back to en)
//   src/fsd/entities/character/model/character-icons.json  (characterId -> round-icon asset path)

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const dataRoot = join(
  webRoot,
  "../../../tacticus-planner-api/src/TacticusPlanner.GameCatalog/Data"
)

function readJsonDir(sub) {
  const dir = join(dataRoot, sub)
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")))
}

// ---- characters: id -> name, and id -> round-icon asset path ---------------------------------
const characters = {}
const characterIcons = {}
for (const faction of readJsonDir("units")) {
  for (const c of faction.characters ?? []) {
    characters[c.id] = c.name
    if (c.roundIcon) characterIcons[c.id] = "/" + c.roundIcon.replace(/^\/+/, "")
  }
}

// ---- upgrades: id -> label -------------------------------------------------------------------
const upgrades = {}
for (const dir of ["upgrades"]) {
  for (const file of readdirSync(join(dataRoot, dir))) {
    if (!file.endsWith(".json")) continue
    for (const u of JSON.parse(readFileSync(join(dataRoot, dir, file), "utf8"))) {
      upgrades[u.id] = u.label
    }
  }
}

// ---- campaign locations: battleId -> "<Campaign> <node>" -------------------------------------
// Display name derives from the group slug (e.g. "fall-of-cadia" -> "Fall of Cadia", "...-vs-..."
// -> "... vs ..."). Difficulty is appended when it is not the base "standard" tier.
const titleCase = (slug) =>
  slug
    .split("-")
    .map((w) => (w === "vs" ? "vs" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
const difficultyLabel = {
  standard: "",
  elite: "Elite",
  mirror: "Mirror",
  eventStandard: "Standard",
  eventStandardChallenge: "Standard Challenge",
  eventExtremis: "Extremis",
  eventExtremisChallenge: "Extremis Challenge",
}
const campaignLocations = {}
for (const group of readJsonDir("campaign-battles")) {
  const name = titleCase(group.groupId)
  for (const b of group.battles ?? []) {
    const diff = difficultyLabel[b.difficulty] ?? b.difficulty
    campaignLocations[b.id] = `${name}${diff ? " " + diff : ""} ${b.nodeNumber}`
  }
}

// ---- ranks: id -> "<Tier> <roman>" -----------------------------------------------------------
const tiers = ["Stone", "Iron", "Bronze", "Silver", "Gold", "Diamond", "Adamantine"]
const romans = ["I", "II", "III"]
const ranks = {}
for (const tier of tiers) {
  for (let i = 0; i < 3; i++) ranks[`${tier}${i + 1}`] = `${tier} ${romans[i]}`
}

// ---- factions: id -> display name (from the reference enums file) -----------------------------
const enums = JSON.parse(readFileSync(join(dataRoot, "enums.json"), "utf8"))
const factions = {}
for (const faction of enums.factions ?? []) {
  factions[faction.id] = faction.displayName
}

// ---- write -----------------------------------------------------------------------------------
const sortKeys = (obj) =>
  Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]))

function writeJson(rel, obj) {
  const path = join(webRoot, rel)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n")
  console.log("wrote", rel, "(" + Object.keys(obj).length + " keys)")
}

const enNamespaces = { characters, upgrades, campaignLocations, ranks, factions }
for (const [ns, data] of Object.entries(enNamespaces)) {
  writeJson(`public/locales/en/${ns}.json`, sortKeys(data))
}
// Proper-noun namespaces are intentionally not translated (the game localizes them separately); write
// empty de/es/fr placeholders that fall back to en. `ranks`/`factions` are hand-translated, so this script
// must NOT touch their de/es/fr files.
for (const lng of ["de", "es", "fr"]) {
  for (const ns of ["characters", "upgrades", "campaignLocations"]) {
    writeJson(`public/locales/${lng}/${ns}.json`, {})
  }
}
writeJson(
  "src/fsd/entities/character/model/character-icons.json",
  sortKeys(characterIcons)
)
