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

/** The trait a unit carries when it summons other units (`winWithoutSummon`). */
const SUMMON_TRAIT = "Summon"

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

/** The factions and traits of a battle's enemies, resolved through the `npcs` dataset. */
export interface BattleEnemies {
  factions: ReadonlySet<string>
  traits: ReadonlySet<string>
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
  for (const wave of battle.waves) {
    for (const enemy of wave.enemies) {
      const npc = npcsById.get(enemy.id)
      if (!npc) continue
      factions.add(npc.factionId)
      for (const trait of npc.traits) traits.add(trait)
    }
  }
  return { factions, traits }
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
    case "anyBattle": {
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
    case "winWithoutSummon": {
      return !members.some((unit) => unit.traits.includes(SUMMON_TRAIT))
    }
    default: {
      // A kind this client does not know progresses nothing rather than everything.
      return false
    }
  }
}
