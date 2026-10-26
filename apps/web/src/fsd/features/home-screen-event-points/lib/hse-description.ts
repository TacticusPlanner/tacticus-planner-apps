import type {
  GameCatalogHseModifier,
  GameCatalogHseRestriction,
  GameCatalogHseTracker,
  GameCatalogHseUnitFilter,
  GameCatalogHseVariant,
} from "@workspace/game-catalog"

// Description lines are data, not text (design D6): each is an i18n key with values that are numbers,
// nested texts (labels resolved from other namespaces) or lists of them. `useHseText` (ui) turns a
// line into the player's language; nothing here knows any copy.

/** A translatable text: an i18n key (with namespace) and its interpolation values. */
export type HseText = {
  key: string
  values?: Record<string, HseTextValue>
  /** Shown when the key has no translation (an id the game-data namespaces do not know yet). */
  fallback?: string
}

/** A list joined in the player's language: "A, B and C" (and), "A or B" (or), "A B" (space). */
type HseTextList = { list: HseText[]; join: "and" | "or" | "space" }

export type HseTextValue = number | HseText | HseTextList

const NS = "dailies:hse.details"

const text = (key: string, values?: Record<string, HseTextValue>): HseText =>
  values ? { key: `${NS}.${key}`, values } : { key: `${NS}.${key}` }

/** Catalog game modes in their canonical order, so a line lists them the same way every time. */
const GAME_MODE_ORDER = [
  "Arena",
  "TournamentArena",
  "Onslaught",
  "SalvageRun",
  "Campaign",
  "MirrorCampaign",
  "EliteCampaign",
  "MirrorEliteCampaign",
  "CampaignEvent",
  "Survival",
  "LegendaryEvent",
  "MachinesOfWarEvent",
  "GuildWars",
  "LinearHeroEvent",
]

const RARITY_ORDER = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
]

const ALLIANCES = new Set(["Imperial", "Chaos", "Xenos"])
/** Enemy tags the copy folds into "excluding Summons". */
const SUMMON_TAGS = new Set(["Summon", "Steppable"])
const MACHINE_OF_WAR = "MachineOfWar"

const byOrder = (order: readonly string[]) => (a: string, b: string) => {
  const rank = (value: string) => {
    const index = order.indexOf(value)
    return index === -1 ? order.length : index
  }
  return rank(a) - rank(b) || a.localeCompare(b)
}

const humanize = (id: string) =>
  id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase())

function modeLabel(mode: string): HseText {
  return { key: `${NS}.modes.${mode}`, fallback: humanize(mode) }
}

/** A trait, alliance or event tag, from the namespace that names it. */
function tagLabel(tag: string): HseText {
  if (ALLIANCES.has(tag))
    return { key: `common:alliances.${tag}`, fallback: tag }
  if (tag === MACHINE_OF_WAR || SUMMON_TAGS.has(tag))
    return { key: `${NS}.tags.${tag}`, fallback: humanize(tag) }
  return { key: `traits:${tag}`, fallback: humanize(tag) }
}

const factionLabel = (factionId: string): HseText => ({
  key: `factions:${factionId}`,
  fallback: humanize(factionId),
})

const unitLabel = (unitId: string): HseText => ({
  key: `npcs:${unitId}`,
  fallback: humanize(unitId),
})

const rarityLabel = (rarity: string): HseText => ({
  key: `${NS}.rarities.${rarity}`,
  fallback: rarity,
})

/** "in Arena, Onslaught and Salvage Run", "in every mode except ...", or "in every mode". */
function modesPhrase(gameModes: GameCatalogHseRestriction | null): HseText {
  const sorted = (modes: readonly string[]) =>
    [...modes].sort(byOrder(GAME_MODE_ORDER)).map(modeLabel)
  if (gameModes?.allowed)
    return text("phrase.modesIn", {
      modes: { list: sorted(gameModes.allowed), join: "and" },
    })
  if (gameModes?.disallowed?.length)
    return text("phrase.modesExcept", {
      modes: { list: sorted(gameModes.disallowed), join: "and" },
    })
  return text("phrase.modesAll")
}

type FilterParts = {
  /** "Psyker", "Imperial", "Dark Angels" ... joined with a space; empty for no filter. */
  qualifiers: HseText[]
  excluded: HseText[]
  /** True when the filter leaves Machines of War out, so its units are characters. */
  charactersOnly: boolean
}

function filterParts(filter: GameCatalogHseUnitFilter | null): FilterParts {
  const allowedTags = filter?.tags?.allowed ?? []
  const disallowedTags = filter?.tags?.disallowed ?? []
  const qualifierLists: HseText[][] = [
    allowedTags.map(tagLabel),
    (filter?.factionIds?.allowed ?? []).map(factionLabel),
  ].filter((labels) => labels.length > 0)
  const qualifiers = qualifierLists.map((labels) =>
    labels.length === 1
      ? labels[0]!
      : text("phrase.group", { items: { list: labels, join: "or" } })
  )
  const excludesSummons = disallowedTags.some((tag) => SUMMON_TAGS.has(tag))
  const excluded = [
    ...disallowedTags
      .filter((tag) => !SUMMON_TAGS.has(tag) && tag !== MACHINE_OF_WAR)
      .map(tagLabel),
    ...(filter?.factionIds?.disallowed ?? []).map(factionLabel),
    ...(excludesSummons ? [text("tags.Summon")] : []),
  ]
  return {
    qualifiers,
    excluded,
    charactersOnly: disallowedTags.includes(MACHINE_OF_WAR),
  }
}

function withExclusions(noun: HseText, excluded: HseText[]): HseText {
  return excluded.length > 0
    ? text("phrase.excluding", {
        noun,
        excluded: { list: excluded, join: "and" },
      })
    : noun
}

/** Plural subject of a modifier line: "Psyker characters", "All characters". */
function modifierUnits(filter: GameCatalogHseUnitFilter | null): HseText {
  const parts = filterParts(filter)
  if (filter?.unitIds?.length)
    return text("phrase.named", {
      names: { list: filter.unitIds.map(unitLabel), join: "and" },
    })
  const noun =
    parts.qualifiers.length > 0
      ? text("phrase.charactersOf", {
          filter: { list: parts.qualifiers, join: "space" },
        })
      : text("phrase.allCharacters")
  return withExclusions(noun, parts.excluded)
}

/** The player's units a tracker counts: "Psyker units", "Imperial characters"; null for any unit. */
function trackerPlayer(
  filter: GameCatalogHseUnitFilter | null
): HseText | null {
  const parts = filterParts(filter)
  if (filter?.unitIds?.length)
    return text("phrase.named", {
      names: { list: filter.unitIds.map(unitLabel), join: "or" },
    })
  if (parts.qualifiers.length === 0 && parts.excluded.length === 0) return null
  const filterValue: HseTextList = { list: parts.qualifiers, join: "space" }
  const noun =
    parts.qualifiers.length === 0
      ? text(parts.charactersOnly ? "phrase.characters" : "phrase.units")
      : text(parts.charactersOnly ? "phrase.charactersOf" : "phrase.unitsOf", {
          filter: filterValue,
        })
  return withExclusions(noun, parts.excluded)
}

/** The enemy a kill tracker counts: "enemy unit (excluding Summons)", "Large Squig". */
function trackerEnemy(filter: GameCatalogHseUnitFilter | null): HseText {
  const parts = filterParts(filter)
  if (filter?.unitIds?.length)
    return text("phrase.named", {
      names: { list: filter.unitIds.map(unitLabel), join: "or" },
    })
  const noun =
    parts.qualifiers.length > 0
      ? text("phrase.enemyOf", {
          filter: { list: parts.qualifiers, join: "space" },
        })
      : text("phrase.enemy")
  return withExclusions(noun, parts.excluded)
}

function rates(
  byRarity: Readonly<Record<string, number>>,
  key: "rateXp" | "ratePoints"
): HseTextList {
  return {
    list: Object.keys(byRarity)
      .sort(byOrder(RARITY_ORDER))
      .map((rarity) =>
        text(`phrase.${key}`, {
          rarity: rarityLabel(rarity),
          value: byRarity[rarity]!,
        })
      ),
    join: "and",
  }
}

function modifierLine(modifier: GameCatalogHseModifier): HseText {
  const units = modifierUnits(modifier.player)
  const modes = modesPhrase(modifier.gameModes)
  if (modifier.kind === "StatBoost")
    return text("lines.stat", {
      units,
      modes,
      health: modifier.healthPct,
      damage: modifier.damagePct,
      armour: modifier.armourPct,
    })
  const team = modifier.sameFactionTeam ? "Team" : ""
  if (modifier.multiplierByRarity)
    return text(`lines.xpByRarity${team}`, {
      units,
      modes,
      rates: rates(modifier.multiplierByRarity, "rateXp"),
    })
  const multiplier = modifier.multiplier ?? 1
  // The game words the same-faction bonus as "+100% XP", not "2x XP".
  return text(`lines.xp${team}`, {
    units,
    modes,
    multiplier,
    bonusPct: Math.round((multiplier - 1) * 100),
  })
}

/** A tracker's points line, or null for a kind this client does not know. */
function trackerLine(tracker: GameCatalogHseTracker): HseText | null {
  const count = tracker.points
  const modes = modesPhrase(tracker.gameModes)
  switch (tracker.kind) {
    case "KillUnits": {
      const player = trackerPlayer(tracker.player)
      const enemy = trackerEnemy(tracker.enemy)
      return player
        ? text("lines.killWith", { count, enemy, player, modes })
        : text("lines.kill", { count, enemy, modes })
    }
    case "DefeatWaves":
      return text("lines.waves", { count, modes })
    case "DeployedUnitsOfFactionMajority":
      return text("lines.factionMajority", { count, modes })
    case "FullLineUpOfFaction":
      return text("lines.fullLineUp", { count, modes })
    case "DonateUpgradeToGuildMember":
      return tracker.pointsByRarity
        ? text("lines.donateUpgradeByRarity", {
            rates: rates(tracker.pointsByRarity, "ratePoints"),
          })
        : text("lines.donateUpgrade", { count })
    case "DonateIntelToGuildProject":
      return text("lines.donateIntel", { count })
    case "DispatchExpedition":
      return text("lines.dispatchExpedition", { count })
    default:
      return null
  }
}

/**
 * The description of a variant, in the order the spec reads it: XP lines, stat lines, then one
 * points line per tracker (an unknown tracker kind renders no line).
 */
export function hseDescriptionLines(
  variant: Pick<GameCatalogHseVariant, "modifiers" | "trackers">
): HseText[] {
  const xp = variant.modifiers.filter((modifier) => modifier.kind === "UnitXp")
  const stats = variant.modifiers.filter(
    (modifier) => modifier.kind === "StatBoost"
  )
  return [
    ...xp.map(modifierLine),
    ...stats.map(modifierLine),
    ...variant.trackers.flatMap((tracker) => trackerLine(tracker) ?? []),
  ]
}
