import type {
  LegendaryEventRun,
  LegendaryEventRunInputs,
} from "../model/plan.types"
import type {
  LegendaryEvent,
  LegendaryEventBattle,
  LegendaryEventUnit,
} from "../model/types"
import { unitDealtDamageTypes } from "./damage-profile-exclusions"
import { runInputValues } from "./run-inputs"

/** One served event mission: a typed requirement parsed server side from its raw `text`. */
export type LegendaryEventMission = LegendaryEvent["regularMissions"][number]

export type LegendaryEventMissionTrack = "regular" | "premium"

/** A mission with the track it belongs to (indexes repeat across tracks). */
export interface LegendaryEventMissionRef {
  track: LegendaryEventMissionTrack
  mission: LegendaryEventMission
}

/**
 * Mission kinds every token progresses as far as the planner can tell, so they never pick a token:
 * `anyBattle` (waves and plain damage), and `winWithoutSummon`, because the catalog marks summoned
 * NPCs rather than the characters that summon them, so a summoner cannot be told apart.
 */
export const UNTRACKED_MISSION_KINDS: ReadonlySet<string> = new Set([
  "anyBattle",
  "winWithoutSummon",
])

/** A track's missions, dropping entries a catalog cached before typed missions still holds as
 *  plain strings (they cannot be matched or ticked). */
export function eventMissions(
  event: Pick<LegendaryEvent, "regularMissions" | "premiumMissions">,
  track: LegendaryEventMissionTrack
): LegendaryEventMission[] {
  const list: readonly unknown[] =
    track === "regular" ? event.regularMissions : event.premiumMissions
  return list.filter(
    (mission): mission is LegendaryEventMission =>
      typeof mission === "object" && mission !== null && "kind" in mission
  )
}

/**
 * The missions suggestions can progress (spec: open missions of the current run): the current
 * run's regular missions not ticked Done, and its premium ones only with Show paid options on and
 * the premium track planned. None without a current run.
 */
export function openMissions({
  event,
  runs,
  currentRun,
  showPaidOptions,
}: {
  event: Pick<LegendaryEvent, "regularMissions" | "premiumMissions">
  runs: readonly LegendaryEventRunInputs[] | undefined
  currentRun: LegendaryEventRun | null
  showPaidOptions: boolean
}): LegendaryEventMissionRef[] {
  if (currentRun === null) return []
  const values = runInputValues(runs, currentRun)
  const open = (
    track: LegendaryEventMissionTrack,
    done: readonly number[]
  ): LegendaryEventMissionRef[] =>
    eventMissions(event, track)
      .filter((mission) => !done.includes(mission.index))
      .map((mission) => ({ track, mission }))
  return [
    ...open("regular", values.completedRegularMissions),
    ...(showPaidOptions && values.premiumMissions > 0
      ? open("premium", values.completedPremiumMissions)
      : []),
  ]
}

/**
 * The missions of `run` ticked Done in its run inputs (the player's progress): regular ones, and
 * premium ones under the same rule as `openMissions`. None without a run.
 */
export function completedMissions({
  event,
  runs,
  currentRun,
  showPaidOptions,
}: {
  event: Pick<LegendaryEvent, "regularMissions" | "premiumMissions">
  runs: readonly LegendaryEventRunInputs[] | undefined
  currentRun: LegendaryEventRun | null
  showPaidOptions: boolean
}): LegendaryEventMissionRef[] {
  if (currentRun === null) return []
  const values = runInputValues(runs, currentRun)
  const done = (
    track: LegendaryEventMissionTrack,
    indexes: readonly number[]
  ): LegendaryEventMissionRef[] =>
    eventMissions(event, track)
      .filter((mission) => indexes.includes(mission.index))
      .map((mission) => ({ track, mission }))
  return [
    ...done("regular", values.completedRegularMissions),
    ...(showPaidOptions && values.premiumMissions > 0
      ? done("premium", values.completedPremiumMissions)
      : []),
  ]
}

/** The factions and traits of a battle's enemies, resolved through the `npcs` dataset. */
export interface BattleEnemies {
  factions: ReadonlySet<string>
  traits: ReadonlySet<string>
  /** How many enemies and waves the battle holds, for mission counts; absent where only the
   *  faction and trait sets are known. */
  counts?: BattleEnemyCounts
}

interface BattleEnemyCounts {
  waves: number
  /** Every enemy across the waves, resolved through the dataset or not. */
  enemies: number
  byFaction: ReadonlyMap<string, number>
  byTrait: ReadonlyMap<string, number>
}

/** Every wave's enemies of `battle`; an id the dataset cannot resolve adds nothing. */
export function battleEnemies(
  battle: Pick<LegendaryEventBattle, "waves">,
  npcsById: ReadonlyMap<
    string,
    { factionId: string; traits: readonly string[] }
  >
): BattleEnemies {
  const factions = new Set<string>()
  const traits = new Set<string>()
  const byFaction = new Map<string, number>()
  const byTrait = new Map<string, number>()
  let enemies = 0
  for (const wave of battle.waves) {
    for (const enemy of wave.enemies) {
      enemies += 1
      const npc = npcsById.get(enemy.id)
      if (!npc) continue
      factions.add(npc.factionId)
      byFaction.set(npc.factionId, (byFaction.get(npc.factionId) ?? 0) + 1)
      for (const trait of new Set(npc.traits)) {
        traits.add(trait)
        byTrait.set(trait, (byTrait.get(trait) ?? 0) + 1)
      }
    }
  }
  return {
    factions,
    traits,
    counts: { waves: battle.waves.length, enemies, byFaction, byTrait },
  }
}

/**
 * Whether a token progresses `mission` (spec: a token progresses a mission by battle and team;
 * design D3). `members` are the team's non-reserve units; `enemies` is undefined when the battle has
 * no served waves, which progresses no faction mission.
 */
export function tokenProgressesMission(
  mission: LegendaryEventMission,
  members: readonly LegendaryEventUnit[],
  enemies: BattleEnemies | undefined
): boolean {
  switch (mission.kind) {
    case "anyBattle":
    case "winWithoutSummon": {
      return true
    }
    case "defeatFaction": {
      if (!enemies) return false
      // "Defeat N Daemon enemies" names a trait rather than a faction.
      if (mission.trait) return enemies.traits.has(mission.trait)
      return mission.faction !== null && enemies.factions.has(mission.faction)
    }
    case "defeatWithAlliance":
    case "useAbilitiesWithAlliance": {
      return members.some((unit) => unit.alliance === mission.alliance)
    }
    case "damageType":
    case "defeatWithDamageType": {
      return (
        mission.damageType !== null &&
        members.some((unit) =>
          unitDealtDamageTypes(unit).includes(mission.damageType!)
        )
      )
    }
    case "winWithoutTrait": {
      return (
        mission.trait !== null &&
        !members.some((unit) => unit.traits.includes(mission.trait!))
      )
    }
    default: {
      // A kind this client does not know progresses nothing rather than everything.
      return false
    }
  }
}

/** How far one token moves a mission (spec: a token's mission amount). `estimate` marks amounts
 *  the planner cannot know exactly (who lands the kill, how many abilities are cast). */
export interface MissionAmount {
  amount: number
  estimate: boolean
}

/**
 * How much a won token adds to `mission`'s count, from the battle's enemy and wave counts and the
 * team's non-reserve members; null for the untracked kinds and unknown kinds. A token that does
 * not progress the mission (`tokenProgressesMission`) adds 0.
 */
export function tokenMissionAmount(
  mission: LegendaryEventMission,
  members: readonly LegendaryEventUnit[],
  enemies: BattleEnemies | undefined
): MissionAmount | null {
  if (UNTRACKED_MISSION_KINDS.has(mission.kind)) return null
  const progresses = tokenProgressesMission(mission, members, enemies)
  const counts = enemies?.counts
  switch (mission.kind) {
    case "defeatFaction": {
      if (!progresses || !counts) return { amount: 0, estimate: false }
      const amount = mission.trait
        ? (counts.byTrait.get(mission.trait) ?? 0)
        : (counts.byFaction.get(mission.faction ?? "") ?? 0)
      return { amount, estimate: false }
    }
    case "defeatWithAlliance":
    case "defeatWithDamageType": {
      // Every enemy, as if the matching units land every kill.
      return { amount: progresses ? (counts?.enemies ?? 0) : 0, estimate: true }
    }
    case "damageType": {
      // The waves the matching units deal that damage over.
      return { amount: progresses ? (counts?.waves ?? 0) : 0, estimate: true }
    }
    case "useAbilitiesWithAlliance": {
      // One ability per matching member per battle.
      const amount = members.filter(
        (unit) => unit.alliance === mission.alliance
      ).length
      return { amount, estimate: true }
    }
    case "winWithoutTrait": {
      return { amount: progresses ? 1 : 0, estimate: false }
    }
    default: {
      return null
    }
  }
}
