import {
  HRE_MISSIONS,
  hreMission,
  type HreObjective,
  type HreObjectiveKind,
} from "./hre-missions"
import { HRE_ALL_DONE, type HreProgress } from "./hre-progress"

/** The lineup an objective restricts or asks for (hre-mission-teams). */
export type HreTeamRule = "alliance" | "summonFree" | "featured" | "ranged"

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
 * The current mission's team suggestion: the first open objective with a lineup rule, played where
 * the mission points. An open Salvage Run objective makes it a Salvage Run team (mission 7). A
 * summon-free win is played in Arena (mission 6). Ranged kills are played in Onslaught (mission 9)
 * unless the mission also asks for Arena battles.
 */
export function selectTeamPlan(state: HreProgress): HreTeamPlan | null {
  if (state.mission >= HRE_ALL_DONE) return null
  const objectives = hreMission(state.mission).objectives
  const open = objectives.filter(
    (objective, index) => state.progress[index]! < objective.target
  )
  const isOpen = (kind: HreObjectiveKind) =>
    open.some((objective) => objective.kind === kind)
  const pick = open.find((objective) => TEAM_RULES[objective.kind])
  if (!pick) return null
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
  return {
    objective: pick,
    rule,
    mode,
    size: mode === "onslaught" ? ONSLAUGHT_POOL_SIZE : TEAM_SIZE,
    support: isOpen("heal"),
    preferPsychic: open.some(
      (objective) =>
        objective.kind === "damageType" && objective.qualifier === "Psychic"
    ),
    reserve: reserveFor(mode, state.mission),
  }
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
