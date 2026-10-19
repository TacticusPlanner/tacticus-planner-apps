import type { HreObjective, HreObjectiveKind } from "./hre-missions"

/** Kinds worded with the featured hero's alliance; without one they use the generic wording. */
const ALLIANCE_KINDS: ReadonlySet<HreObjectiveKind> = new Set([
  "killWithAlliance",
  "useAbilitiesAlliance",
  "winWithAllianceLineup",
])

/** The `hre` namespace key and interpolation values that word one objective (design D1). */
export function objectiveTextKey(
  objective: HreObjective,
  context: {
    /** The featured hero's alliance id, or null when the hero does not resolve. */
    alliance: string | null
    hero: string
    formatNumber: (value: number) => string
  }
): { key: string; values: Record<string, string | number> } {
  const generic = ALLIANCE_KINDS.has(objective.kind) && !context.alliance
  return {
    key: `objectives.${generic ? "generic." : ""}${objective.kind}`,
    values: {
      count: objective.target,
      target: context.formatNumber(objective.target),
      alliance: context.alliance ?? "",
      hero: context.hero,
      qualifier: objective.qualifier ?? "",
    },
  }
}
