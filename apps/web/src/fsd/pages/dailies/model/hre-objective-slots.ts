import type {
  HreCampaignPlan,
  HreObjective,
  HreTeamPlan,
} from "@/entities/hre-mission"

/** What sits under one objective of the current mission. */
export type HreObjectiveSlot =
  /** Its raids (a campaign-win, campaign-raid or lightning objective). */
  | { kind: "raids" }
  /** The battles to fight by hand, under the first manual objective they serve. */
  | { kind: "battles" }
  /** The battles above serve this objective too (the second manual objective). */
  | { kind: "sharedBattles" }
  /** A token-mode team: the objective's own mode, or a spare-token mode of a manual objective. */
  | { kind: "team"; planIndex: number }

/**
 * Where each suggestion of the current mission folds: raids under their objective, the battles by
 * hand and every spare-token team under the first manual objective they serve (the second gets a
 * line saying they count for it too), and a token objective's team under it.
 */
export function hreObjectiveSlots(
  objective: HreObjective,
  campaign: Pick<HreCampaignPlan, "raids" | "battles"> | null,
  teamPlans: readonly HreTeamPlan[]
): HreObjectiveSlot[] {
  const slots: HreObjectiveSlot[] = []
  if (campaign?.raids?.objective === objective) slots.push({ kind: "raids" })
  const needs = campaign?.battles?.needs ?? []
  if (needs[0]?.objective === objective) slots.push({ kind: "battles" })
  else if (needs.some((need) => need.objective === objective)) {
    slots.push({ kind: "sharedBattles" })
  }
  teamPlans.forEach((plan, planIndex) => {
    if (plan.mode !== "battle" && plan.objectives[0] === objective) {
      slots.push({ kind: "team", planIndex })
    }
  })
  return slots
}
