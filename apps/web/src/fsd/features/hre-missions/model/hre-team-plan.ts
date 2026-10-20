import {
  HRE_MISSIONS,
  hreMission,
  type HreObjective,
  type HreObjectiveKind,
} from "./hre-missions"
import { isManualObjective } from "./hre-objectives"
import { HRE_ALL_DONE, type HreProgress } from "./hre-progress"

/** The lineup the mission's manual objectives ask for (hre-mission-teams). */
export type HreTeamRule =
  | "alliance"
  | "summonFree"
  | "featured"
  | "ranged"
  | "melee"
  /** Any units: every ability use counts. */
  | "abilities"
  /** Any units, strongest first (kills, damage, healing, or a token objective alone). */
  | "strongest"

/** Where the team plays: campaign battles by hand, or a token mode. */
type HreTeamMode = "battle" | "arena" | "salvageRun" | "onslaught" | "guildRaid"

export type HreTeamPlan = {
  /** The open objectives the team serves. */
  objectives: HreObjective[]
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

/** The rule each manual kind asks for, strongest rule first when two objectives meet. */
const RULE_BY_KIND: Partial<Record<HreObjectiveKind, HreTeamRule>> = {
  useAbilitiesFeatured: "featured",
  featuredDamage: "featured",
  winWithAllianceLineup: "alliance",
  useAbilitiesAlliance: "alliance",
  killWithAlliance: "alliance",
  winWithoutSummons: "summonFree",
  killWithRanged: "ranged",
  killWithMelee: "melee",
  useAbilities: "abilities",
}
const RULE_ORDER: readonly HreTeamRule[] = [
  "featured",
  "alliance",
  "summonFree",
  "ranged",
  "melee",
  "abilities",
  "strongest",
]

const TOKEN_MODES: Partial<Record<HreObjectiveKind, HreTeamMode>> = {
  arenaBattles: "arena",
  salvageRuns: "salvageRun",
  onslaught: "onslaught",
  guildRaids: "guildRaid",
}
const MODE_KINDS: Partial<Record<HreTeamMode, HreObjectiveKind>> = {
  arena: "arenaBattles",
  salvageRun: "salvageRuns",
  onslaught: "onslaught",
  guildRaid: "guildRaids",
}

const TEAM_SIZE = 5
/** Onslaught pool: five to start, three spares for the units that fall during the run. */
const ONSLAUGHT_POOL_SIZE = 8

/** The rule of the strictest objective among `objectives` (mission pairs never conflict). */
function ruleFor(objectives: readonly HreObjective[]): HreTeamRule {
  const rules = objectives.map(
    (objective) => RULE_BY_KIND[objective.kind] ?? "strongest"
  )
  return RULE_ORDER.find((rule) => rules.includes(rule)) ?? "strongest"
}

/**
 * The current mission's teams (design D9). Its open manual objectives share one campaign team for
 * the battles fought by hand, with the strictest rule of the two. Every open token objective gets
 * a team for its mode with that same rule, or the strongest units when it is open alone. Ranged
 * kills also get an Onslaught pool when no Arena battles are open, and any-unit ability uses always
 * do (missions 3 and 15). Summon-free wins (mission 6) get an Arena team while Arena tokens above a
 * later mission's reserve are left (`arenaSurplus`). A heal objective adds a Healer or Mechanic and
 * a Psychic damage objective puts Psychic damage dealers first, in every team.
 */
export function selectTeamPlans(
  state: HreProgress,
  arenaSurplus = 0
): HreTeamPlan[] {
  if (state.mission >= HRE_ALL_DONE) return []
  const objectives = hreMission(state.mission).objectives
  const open = objectives.filter(
    (objective, index) => state.progress[index]! < objective.target
  )
  const manual = open.filter((objective) => isManualObjective(objective.kind))
  const rule = ruleFor(manual)
  const plan = (
    served: HreObjective[],
    mode: HreTeamMode,
    teamRule = rule
  ): HreTeamPlan => ({
    objectives: served,
    rule: teamRule,
    mode,
    size: mode === "onslaught" ? ONSLAUGHT_POOL_SIZE : TEAM_SIZE,
    support: open.some((item) => item.kind === "heal"),
    preferPsychic: open.some(
      (item) => item.kind === "damageType" && item.qualifier === "Psychic"
    ),
    reserve: reserveFor(mode, state.mission),
  })
  const plans: HreTeamPlan[] = []
  if (manual.length > 0) plans.push(plan(manual, "battle"))
  const tokenModes = new Set<HreTeamMode>()
  for (const objective of open) {
    const mode = TOKEN_MODES[objective.kind]
    if (!mode) continue
    tokenModes.add(mode)
    plans.push(plan([objective, ...manual], mode))
  }
  const onslaughtPool =
    (rule === "ranged" && !tokenModes.has("arena")) || rule === "abilities"
  if (onslaughtPool && !tokenModes.has("onslaught")) {
    plans.push(plan(manual, "onslaught"))
  }
  if (rule === "summonFree" && arenaSurplus > 0 && !tokenModes.has("arena")) {
    plans.push(plan(manual, "arena"))
  }
  return plans
}

/** Arena tokens above the next later mission's Arena need (mission 6's surplus over mission 10's 4),
 * or 0 when Arena tokens are unknown. */
export function arenaSurplus(
  state: HreProgress,
  tokens: number | null
): number {
  if (tokens === null) return 0
  const reserve = reserveFor("arena", state.mission)
  return Math.max(0, tokens - (reserve?.tokens ?? 0))
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
