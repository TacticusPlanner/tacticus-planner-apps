import {
  hseRestrictionPasses,
  type GameCatalogHseTracker,
  type GameCatalogHseUnitFilter,
} from "@workspace/game-catalog"
import { progressionRarity, type UnitId } from "@workspace/game-domain"

import {
  HSE_TOKEN_MODES,
  hseModeScoring,
} from "@/features/home-screen-event-points"
import type { UnitPowerContext } from "@/shared/unit-power"

import { combatPowerOf } from "./team-eligibility"
import { buildTeamRecommendations } from "./team-recommendations"
import {
  HSE_TEAM_SIZE,
  type BuildHseTeamRecommendationsInput,
  type HseEnemyHint,
  type HseEnemyLabel,
  type HseModeTeams,
  type HseTeam,
  type HseTeamCatalog,
  type HseTeamMode,
  type HseTeamPick,
  type HseTeamRecommendations,
} from "./hse-team-recommendations.types"
import { SALVAGE_TRACKS } from "./salvage-recommendations.types"
import type { SalvageTrack } from "./salvage-recommendations.types"
import {
  MIN_TEAM_SIZE,
  type EventUnitMatch,
  type TeamPoolSpec,
  type TeamRosterCharacter,
} from "./team-recommendations.types"

/** Tracker kinds that count a kill, wave or line-up by the player's units in a token mode. */
const SCORING_KINDS = new Set([
  "KillUnits",
  "DefeatWaves",
  "DeployedUnitsOfFactionMajority",
  "FullLineUpOfFaction",
])
/** Line-up trackers (Faction Focus): scored per battle by the team's faction make-up. */
const LINE_UP_KINDS = new Set([
  "DeployedUnitsOfFactionMajority",
  "FullLineUpOfFaction",
])

const ALLIANCES = new Set(["Imperial", "Chaos", "Xenos"])
const MACHINE_OF_WAR = "MachineOfWar"
/** Enemy tags that only leave Summons out; alone they make no hint. */
const SUMMON_TAGS = new Set(["Summon", "Steppable"])

const EVENT_UNITS_POOL_ID = "event-units"

/** The attributes a player filter is matched against. */
type HseUnit = {
  unitId: UnitId
  traits: readonly string[]
  alliance: string
  faction: string
}

/** True when a player filter narrows the units at all. Characters are never Machines of War, so a
 * filter that only disallows `MachineOfWar` counts as no filter. */
function narrowsPlayers(filter: GameCatalogHseUnitFilter | null): boolean {
  if (!filter) return false
  const disallowedTags = (filter.tags?.disallowed ?? []).filter(
    (tag) => tag !== MACHINE_OF_WAR
  )
  return (
    !!filter.tags?.allowed ||
    disallowedTags.length > 0 ||
    !!filter.factionIds?.allowed ||
    !!filter.factionIds?.disallowed?.length ||
    !!filter.unitIds?.length
  )
}

/** True when the unit passes the filter: `tags` against its traits and alliance (any allowed tag,
 * no disallowed one), `factionIds` against its faction, `unitIds` against its id. */
function passesFilter(
  filter: GameCatalogHseUnitFilter,
  unit: HseUnit
): boolean {
  const tags = [...unit.traits, unit.alliance]
  if (filter.tags?.disallowed?.some((tag) => tags.includes(tag))) return false
  if (
    filter.tags?.allowed &&
    !filter.tags.allowed.some((t) => tags.includes(t))
  )
    return false
  if (!hseRestrictionPasses(filter.factionIds, unit.faction)) return false
  if (filter.unitIds?.length && !filter.unitIds.includes(unit.unitId))
    return false
  return true
}

const MATCH_PRIORITY: Record<EventUnitMatch["via"], number> = {
  faction: 3,
  trait: 2,
  alliance: 1,
}

/** What a passed filter names for this unit: its faction, else a trait, else its alliance. */
function matchOf(
  filter: GameCatalogHseUnitFilter,
  unit: HseUnit
): EventUnitMatch | undefined {
  if (filter.factionIds?.allowed?.includes(unit.faction))
    return { via: "faction", id: unit.faction }
  const allowedTags = filter.tags?.allowed ?? []
  const trait = unit.traits.find((value) => allowedTags.includes(value))
  if (trait) return { via: "trait", id: trait }
  if (allowedTags.includes(unit.alliance))
    return { via: "alliance", id: unit.alliance }
  return undefined
}

function bestMatch(
  matches: readonly (EventUnitMatch | undefined)[]
): EventUnitMatch | undefined {
  let best: EventUnitMatch | undefined
  for (const match of matches) {
    if (
      match &&
      (!best || MATCH_PRIORITY[match.via] > MATCH_PRIORITY[best.via])
    )
      best = match
  }
  return best
}

/** The scoring trackers of one mode. */
function modeTrackers(
  trackers: readonly GameCatalogHseTracker[],
  mode: HseTeamMode
): GameCatalogHseTracker[] {
  return trackers.filter(
    (tracker) =>
      SCORING_KINDS.has(tracker.kind) &&
      hseRestrictionPasses(tracker.gameModes, mode)
  )
}

function tagLabel(tag: string): HseEnemyLabel {
  return { via: ALLIANCES.has(tag) ? "alliance" : "trait", id: tag }
}

/** The enemy-side rule of a tracker, or null when it counts every enemy but Summons. */
function enemyHint(
  filter: GameCatalogHseUnitFilter | null
): HseEnemyHint | null {
  if (!filter) return null
  const allowed: HseEnemyLabel[] = [
    ...(filter.tags?.allowed ?? []).map(tagLabel),
    ...(filter.factionIds?.allowed ?? []).map((id): HseEnemyLabel => ({
      via: "faction",
      id,
    })),
    ...(filter.unitIds ?? []).map((id): HseEnemyLabel => ({ via: "unit", id })),
  ]
  const excluded: HseEnemyLabel[] = [
    ...(filter.tags?.disallowed ?? [])
      .filter((tag) => !SUMMON_TAGS.has(tag))
      .map(tagLabel),
    ...(filter.factionIds?.disallowed ?? []).map((id): HseEnemyLabel => ({
      via: "faction",
      id,
    })),
  ]
  if (allowed.length === 0 && excluded.length === 0) return null
  return { allowed, excluded }
}

/** Distinct enemy-side rules of the mode's scoring trackers, in tracker order. */
function modeHints(trackers: readonly GameCatalogHseTracker[]): HseEnemyHint[] {
  const seen = new Set<string>()
  const hints: HseEnemyHint[] = []
  for (const tracker of trackers) {
    const hint = enemyHint(tracker.enemy)
    if (!hint) continue
    const key = JSON.stringify(hint)
    if (seen.has(key)) continue
    seen.add(key)
    hints.push(hint)
  }
  return hints
}

/**
 * Faction Focus (design D2): a full line-up needs five characters of one faction, so factions with at
 * least five characters in `roster` rank first; among them (or, when none has five, among all) the
 * one whose five strongest characters have the highest summed combat power wins, ties by faction id.
 * Null for an empty roster.
 */
function strongestFaction(
  roster: readonly TeamRosterCharacter[],
  catalog: HseTeamCatalog,
  unitPower: UnitPowerContext | null
): string | null {
  const powersByFaction = new Map<string, number[]>()
  for (const character of roster) {
    const faction = catalog.get(character.unitId)?.faction
    if (!faction) continue
    const powers = powersByFaction.get(faction) ?? []
    powers.push(combatPowerOf(character, unitPower))
    powersByFaction.set(faction, powers)
  }
  let best: { faction: string; full: boolean; power: number } | null = null
  for (const [faction, powers] of powersByFaction) {
    const full = powers.length >= HSE_TEAM_SIZE
    const power = [...powers]
      .sort((a, b) => b - a)
      .slice(0, HSE_TEAM_SIZE)
      .reduce((sum, value) => sum + value, 0)
    const better =
      !best ||
      (full && !best.full) ||
      (full === best.full &&
        (power > best.power ||
          (power === best.power && faction < best.faction)))
    if (better) best = { faction, full, power }
  }
  return best?.faction ?? null
}

/** The event-unit pool of one team, with how it was picked. */
function eventPool(
  trackers: readonly GameCatalogHseTracker[],
  roster: readonly TeamRosterCharacter[],
  catalog: HseTeamCatalog,
  unitPower: UnitPowerContext | null
): { pick: HseTeamPick; pools: TeamPoolSpec[] } {
  if (trackers.some((tracker) => LINE_UP_KINDS.has(tracker.kind))) {
    const factionId = strongestFaction(roster, catalog, unitPower)
    if (!factionId) return { pick: { kind: "any-unit" }, pools: [] }
    const unitIds = new Set(
      roster
        .filter((c) => catalog.get(c.unitId)?.faction === factionId)
        .map((c) => c.unitId)
    )
    return {
      pick: { kind: "faction", factionId },
      pools: [
        {
          id: EVENT_UNITS_POOL_ID,
          unitIds,
          rationaleFor: () => ({
            kind: "event-unit",
            match: { via: "faction", id: factionId },
          }),
        },
      ],
    }
  }

  const filters = trackers
    .map((tracker) => tracker.player)
    .filter(
      (filter): filter is GameCatalogHseUnitFilter =>
        filter !== null && narrowsPlayers(filter)
    )
  if (filters.length === 0) return { pick: { kind: "any-unit" }, pools: [] }
  // A tracker without a narrowing player filter scores for every unit (11th Edition Week 3 in
  // Arena): the filtered characters only rank first, and the rest still score, so the pool is the
  // whole roster and the team is never broadened.
  const anyUnitScores = trackers.some(
    (tracker) => !narrowsPlayers(tracker.player)
  )

  const matchCount = new Map<UnitId, number>()
  const matchById = new Map<UnitId, EventUnitMatch | undefined>()
  for (const character of roster) {
    const view = catalog.get(character.unitId)
    if (!view) continue
    const unit: HseUnit = { unitId: character.unitId, ...view }
    const passed = filters.filter((filter) => passesFilter(filter, unit))
    if (passed.length === 0) continue
    matchCount.set(character.unitId, passed.length)
    matchById.set(
      character.unitId,
      bestMatch(passed.map((filter) => matchOf(filter, unit)))
    )
  }
  return {
    pick: { kind: "event-units" },
    pools: [
      {
        id: EVENT_UNITS_POOL_ID,
        unitIds: anyUnitScores
          ? new Set(roster.map((character) => character.unitId))
          : new Set(matchCount.keys()),
        // A character matching no filter only scores through the any-unit tracker: "Scores for the
        // event" without a named match.
        rationaleFor: (id) => {
          const match = matchById.get(id)
          return match ? { kind: "event-unit", match } : { kind: "event-unit" }
        },
        // Characters passing more of the trackers lead (Faction Boost: Dark Angels before other
        // Imperial characters).
        rankOf: (id) => matchCount.get(id) ?? 0,
      },
    ],
  }
}

function buildTeam(
  trackers: readonly GameCatalogHseTracker[],
  roster: readonly TeamRosterCharacter[],
  catalog: HseTeamCatalog,
  alliance: SalvageTrack | null,
  unitPower: UnitPowerContext | null
): HseTeam {
  if (roster.length < MIN_TEAM_SIZE) {
    return {
      status: "insufficient",
      alliance,
      ownedCount: roster.length,
      needed: MIN_TEAM_SIZE - roster.length,
      eligible: roster.map((character) => ({
        unitId: character.unitId,
        rank: character.rank,
        rarity: progressionRarity(character.progression),
      })),
    }
  }
  const { pick, pools } = eventPool(trackers, roster, catalog, unitPower)
  const recommendations = buildTeamRecommendations({
    mode: "power",
    teamSize: HSE_TEAM_SIZE,
    roster,
    pools,
    preferences: {},
    lockedRandomUnitIds: [],
    randomSeed: 0,
    leadWithPools: true,
    unitPower,
  })
  const team = recommendations.categories.find((c) => c.id === "plan")!
  return { status: "ready", alliance, pick, team }
}

/**
 * A running HSE's event-unit pools for another event's team in `mode` (an HRE mission team), so its
 * units lead and both events progress: empty when the event does not score in `mode`.
 */
export function hseEventUnitPools(
  trackers: readonly GameCatalogHseTracker[],
  mode: HseTeamMode,
  roster: readonly TeamRosterCharacter[],
  catalog: HseTeamCatalog,
  unitPower: UnitPowerContext | null
): TeamPoolSpec[] {
  const scoring = modeTrackers(trackers, mode)
  if (scoring.length === 0) return []
  return eventPool(scoring, roster, catalog, unitPower).pools
}

/** The token modes the trackers score in, in display order. */
export function hseTeamModes(
  trackers: readonly GameCatalogHseTracker[]
): HseTeamMode[] {
  const scoring = new Set(hseModeScoring(trackers).map((entry) => entry.mode))
  return HSE_TOKEN_MODES.filter((mode) => scoring.has(mode))
}

/**
 * The HSE event teams (design D2, D3): for every token mode the event scores in, the shared
 * engine's Plan team in Power Mode, size five, led by the mode's event units — one team over the
 * whole roster for Arena, one per alliance for Onslaught and Salvage Run — plus the mode's
 * enemy-side hints.
 */
export function buildHseTeamRecommendations(
  input: BuildHseTeamRecommendationsInput
): HseTeamRecommendations {
  const roster: TeamRosterCharacter[] = input.roster.flatMap((character) => {
    const view = input.catalog.get(character.unitId)
    return view ? [{ ...character, traits: view.traits, damageTypes: [] }] : []
  })

  const modes = hseTeamModes(input.trackers).map((mode): HseModeTeams => {
    const trackers = modeTrackers(input.trackers, mode)
    const teams =
      mode === "Arena"
        ? [buildTeam(trackers, roster, input.catalog, null, input.unitPower)]
        : SALVAGE_TRACKS.map((alliance) =>
            buildTeam(
              trackers,
              roster.filter(
                (c) => input.catalog.get(c.unitId)?.alliance === alliance
              ),
              input.catalog,
              alliance,
              input.unitPower
            )
          )
    return { mode, hints: modeHints(trackers), teams }
  })
  return { modes }
}
