import { hreAllDone, hreMission } from "./hre-missions"
import type { HreMission, HreObjective, HreObjectiveKind } from "./hre-missions"
import { HRE_SPARE_MODES, isManualObjective } from "./hre-objectives"
import type { HreSpareMode, HreSpareTokens } from "./hre-objectives"
import type { HreProgress } from "./hre-progress"

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
  /** A manual objective played with spare tokens: the tokens held against the remaining missions'
   * need, `held - need` battles to play. Null for the campaign team and a token objective's team. */
  spare: { held: number; need: number } | null
  /** Onslaught ability uses: the whole alliance, weakest first, each using its ability before it
   * falls and the next one deploys. */
  wholeTrack: boolean
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

/** Kinds whose count waves of enemies serve best: Onslaught and Salvage Run come first for them. */
const WAVE_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "killEnemies",
  "killWithMelee",
  "killWithRanged",
  "killWithAlliance",
  "killFaction",
  "damage",
  "abilityDamage",
  "damageType",
  "featuredDamage",
  "heal",
  "useAbilities",
  "useAbilitiesAlliance",
])
/** Ability uses every unit makes: Onslaught fields the whole alliance, weakest first. */
const POOL_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "useAbilities",
  "useAbilitiesAlliance",
])

/** The spare-token modes in the order a mission's manual objectives suit them. */
function spareOrder(manual: readonly HreObjective[]): readonly HreSpareMode[] {
  return manual.some((objective) => WAVE_KINDS.has(objective.kind))
    ? ["onslaught", "salvageRun", "arena"]
    : HRE_SPARE_MODES
}

/**
 * The current mission's teams (design D9). Its open manual objectives share one campaign team for
 * the battles fought by hand, with the strictest rule of the two. Every open token objective gets
 * a team for its mode with that same rule, or the strongest units when it is open alone. The manual
 * objectives also get a team in every spare-token mode (`spareTokens`: Arena, Onslaught or Salvage
 * Run tokens above what the remaining missions need) the mission does not already play, Onslaught
 * and Salvage Run first for kills, damage, healing and ability uses, whose enemies come in waves;
 * Onslaught ability uses field the whole alliance, weakest first. A heal objective adds a Healer
 * or Mechanic and a Psychic damage objective puts Psychic damage dealers first, in every team.
 */
export function selectTeamPlans(
  state: HreProgress,
  missions: readonly HreMission[],
  spare: HreSpareTokens = {}
): HreTeamPlan[] {
  if (state.mission >= hreAllDone(missions)) return []
  const objectives = hreMission(missions, state.mission).objectives
  const open = objectives.filter(
    // No stored progress for an objective reads as 0.
    (objective, index) => (state.progress[index] ?? 0) < objective.target
  )
  const manual = open.filter((objective) => isManualObjective(objective.kind))
  const rule = ruleFor(manual)
  const plan = (
    served: HreObjective[],
    mode: HreTeamMode,
    extra: Partial<Pick<HreTeamPlan, "spare" | "wholeTrack">> = {}
  ): HreTeamPlan => ({
    objectives: served,
    rule,
    mode,
    size: mode === "onslaught" ? ONSLAUGHT_POOL_SIZE : TEAM_SIZE,
    support: open.some((item) => item.kind === "heal"),
    preferPsychic: open.some(
      (item) => item.kind === "damageType" && item.qualifier === "Psychic"
    ),
    // Spare tokens are already what the later missions leave over.
    reserve: extra.spare ? null : reserveFor(mode, state.mission, missions),
    spare: extra.spare ?? null,
    wholeTrack: extra.wholeTrack ?? false,
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
  if (manual.length === 0) return plans
  for (const mode of spareOrder(manual)) {
    const tokens = spare[mode]
    if (!tokens || tokenModes.has(mode)) continue
    plans.push(
      plan(manual, mode, {
        spare: tokens,
        wholeTrack:
          mode === "onslaught" &&
          manual.some((objective) => POOL_KINDS.has(objective.kind)),
      })
    )
  }
  return plans
}

/** The next later mission's need for `mode`'s tokens (mission 6's Arena: 4 for mission 10). */
function reserveFor(
  mode: HreTeamMode,
  current: number,
  missions: readonly HreMission[]
): HreTeamPlan["reserve"] {
  const kind = MODE_KINDS[mode]
  if (!kind) return null
  for (const mission of missions) {
    if (mission.number <= current) continue
    const objective = mission.objectives.find((item) => item.kind === kind)
    if (objective) {
      return { tokens: objective.target, missionNumber: mission.number }
    }
  }
  return null
}
