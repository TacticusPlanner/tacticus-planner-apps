import {
  HRE_MISSIONS,
  hreMission,
  type HreObjective,
  type HreObjectiveKind,
} from "./hre-missions"
import { HRE_ALL_DONE, type HreProgress } from "./hre-progress"

/** The lineup an objective restricts or asks for (hre-mission-teams). */
export type HreTeamRule =
  | "alliance"
  | "summonFree"
  | "featured"
  | "ranged"
  /** Any units: every ability use counts (mission 15). */
  | "abilities"

/** Where the team plays: campaign battles, or the token mode the mission's objectives point to. */
type HreTeamMode = "battle" | "arena" | "salvageRun" | "onslaught"

export type HreTeamPlan = {
  objective: HreObjective
  rule: HreTeamRule
  mode: HreTeamMode
  /** Units to suggest: five, or more for Onslaught, where fallen units are replaced mid-run. */
  size: number
  /** Field one Healer or Mechanic, while the mission's heal objective is open. */
  support: boolean
  /** Rank Psychic damage dealers first, while the mission's Psychic damage objective is open. */
  preferPsychic: boolean
  /** Tokens of `mode` a later mission needs, to keep rather than spend now. */
  reserve: { tokens: number; missionNumber: number } | null
}

const TEAM_RULES: Partial<Record<HreObjectiveKind, HreTeamRule>> = {
  winWithAllianceLineup: "alliance",
  useAbilitiesAlliance: "alliance",
  winWithoutSummons: "summonFree",
  killWithRanged: "ranged",
  useAbilitiesFeatured: "featured",
  featuredDamage: "featured",
}

const MODE_KINDS: Partial<Record<HreTeamMode, HreObjectiveKind>> = {
  arena: "arenaBattles",
  salvageRun: "salvageRuns",
  onslaught: "onslaught",
}

const TEAM_SIZE = 5
/** Onslaught pool: five to start, three spares for the units that fall during the run. */
const ONSLAUGHT_POOL_SIZE = 8

/**
 * The current mission's team suggestions: the first open objective with a lineup rule, played where
 * the mission points. An open Salvage Run objective makes it a Salvage Run team (mission 7). A
 * summon-free win is played in Arena (mission 6). Ranged kills are played in Onslaught (mission 9)
 * unless the mission also asks for Arena battles. Without a lineup rule, an open ability-use
 * objective gets an Arena team while Arena battles are open and an Onslaught pool, where every
 * ability use counts (mission 15).
 */
export function selectTeamPlans(state: HreProgress): HreTeamPlan[] {
  if (state.mission >= HRE_ALL_DONE) return []
  const objectives = hreMission(state.mission).objectives
  const open = objectives.filter(
    (objective, index) => state.progress[index]! < objective.target
  )
  const isOpen = (kind: HreObjectiveKind) =>
    open.some((objective) => objective.kind === kind)
  const plan = (
    objective: HreObjective,
    rule: HreTeamRule,
    mode: HreTeamMode
  ): HreTeamPlan => ({
    objective,
    rule,
    mode,
    size: mode === "onslaught" ? ONSLAUGHT_POOL_SIZE : TEAM_SIZE,
    support: isOpen("heal"),
    preferPsychic: open.some(
      (item) => item.kind === "damageType" && item.qualifier === "Psychic"
    ),
    reserve: reserveFor(mode, state.mission),
  })
  const pick = open.find((objective) => TEAM_RULES[objective.kind])
  if (!pick) {
    const abilities = open.find(
      (objective) => objective.kind === "useAbilities"
    )
    if (!abilities) return []
    return [
      ...(isOpen("arenaBattles")
        ? [plan(abilities, "abilities", "arena")]
        : []),
      plan(abilities, "abilities", "onslaught"),
    ]
  }
  const rule = TEAM_RULES[pick.kind]!
  const mode: HreTeamMode = isOpen("salvageRuns")
    ? "salvageRun"
    : rule === "summonFree"
      ? "arena"
      : rule === "ranged"
        ? isOpen("arenaBattles")
          ? "arena"
          : "onslaught"
        : "battle"
  return [plan(pick, rule, mode)]
}

/** The next later mission's need for `mode`'s tokens (mission 6's Arena: 4 for mission 10). */
function reserveFor(
  mode: HreTeamMode,
  current: number
): HreTeamPlan["reserve"] {
  const kind = MODE_KINDS[mode]
  if (!kind) return null
  for (const mission of HRE_MISSIONS) {
    if (mission.number <= current) continue
    const objective = mission.objectives.find((item) => item.kind === kind)
    if (objective) {
      return { tokens: objective.target, missionNumber: mission.number }
    }
  }
  return null
}
