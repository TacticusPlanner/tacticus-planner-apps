import { useTranslation } from "react-i18next"
import { useQueries } from "@tanstack/react-query"

import {
  describeRankTargetKey,
  goalQueries,
  goalRankTargetKey,
  type GoalKind,
} from "@/entities/goal"

export type SlotGoal = {
  goalId: string
  entityType: string
  entityId: string
  goalType: string
  status: string
}

/** A project holds at most one Active/Paused goal per non-Rank unit-and-goal-type slot, and at most one
 * per unit and exact Rank end target (`rankKey`, the normalized `<rank>:<slots>` key) — different Rank
 * targets for one unit coexist. An unknown Rank target (its detail is still loading) gets a slot of its
 * own so it never blocks anything; the server stays authoritative. */
const slotKey = (goal: SlotGoal, rankKey?: string) =>
  goal.goalType === "Rank"
    ? `${goal.entityType}:${goal.entityId}:Rank:${rankKey ?? `pending:${goal.goalId}`}`
    : `${goal.entityType}:${goal.entityId}:${goal.goalType}`

const occupiesSlot = (goal: { status: string }) =>
  goal.status === "Active" || goal.status === "Paused"

const entityKey = (goal: { entityType: string; entityId: string }) =>
  `${goal.entityType}:${goal.entityId}`

const inFlightRank = (goal: { goalType: string; status: string }) =>
  goal.goalType === "Rank" && occupiesSlot(goal)

/**
 * Client-side slot pre-check for a membership edit. The endpoint checks slot uniqueness across the
 * *entire* desired set and rejects the whole save on any collision, so the check spans the desired set
 * (baseline members minus pending removals, plus pending additions) — a pending removal frees its slot for
 * a pending addition, and one conflicting pick never discards the user's whole batch.
 *
 * The list endpoints carry summaries only, so an in-flight Rank goal's end target is read from its detail
 * (shared cache with the Goals page). Only Rank goals of a unit that already has a member or a desired goal
 * can collide, so other units' goals are never fetched.
 */
export function useMembershipSlots({
  enabled,
  candidates,
  members,
  desired,
}: {
  enabled: boolean
  /** Every goal the sheet lists. */
  candidates: SlotGoal[]
  /** The reviewed baseline membership. */
  members: SlotGoal[]
  /** The goals in the desired set. */
  desired: SlotGoal[]
}) {
  const { t } = useTranslation()

  const anchoredUnits = new Set(
    [...members, ...desired].filter(inFlightRank).map(entityKey)
  )
  const rankGoalIds = [
    ...new Set(
      [...candidates, ...members]
        .filter(
          (goal) => inFlightRank(goal) && anchoredUnits.has(entityKey(goal))
        )
        .map((goal) => goal.goalId)
    ),
  ]
  const rankDetailQueries = useQueries({
    queries: rankGoalIds.map((goalId) => ({
      ...goalQueries.detail(goalId),
      enabled,
    })),
  })
  const rankKeys = new Map<string, string>()
  rankDetailQueries.forEach((query, index) => {
    const key = query.data ? goalRankTargetKey(query.data) : null
    if (key) rankKeys.set(rankGoalIds[index]!, key)
  })
  const rankKeysPending = rankDetailQueries.some((query) => query.isPending)

  // "Rank · Silver3 (3/6)" — the target a Rank row stands for, so two milestones for one unit read apart.
  const rankTargetLabel = (goal: SlotGoal) => {
    const target = describeRankTargetKey(rankKeys.get(goal.goalId) ?? "")
    if (!target) return null
    const rankName = t(`ranks.${target.rank}`, {
      ns: "progression",
      defaultValue: target.rank,
    })
    return target.slots > 0 ? `${rankName} (${target.slots}/6)` : rankName
  }

  const slotOwners = new Map<string, string>()
  for (const goal of desired) {
    const key = slotKey(goal, rankKeys.get(goal.goalId))
    if (occupiesSlot(goal) && !slotOwners.has(key)) {
      slotOwners.set(key, goal.goalId)
    }
  }

  /** Why `goal` cannot be added to the desired set, or null when it can (or already is in it). */
  const blockedReason = (goal: SlotGoal, inDesiredSet: boolean) => {
    if (inDesiredSet || !occupiesSlot(goal)) return null
    const owner = slotOwners.get(slotKey(goal, rankKeys.get(goal.goalId)))
    if (!owner || owner === goal.goalId) return null
    const target = goal.goalType === "Rank" ? rankTargetLabel(goal) : null
    return target
      ? t("goals.project.assemblyRankTargetTaken", { target })
      : t("goals.project.assemblySlotTaken", {
          type: t(`goals.create.goalTypes.${goal.goalType as GoalKind}`),
        })
  }

  return { rankKeysPending, rankTargetLabel, blockedReason }
}
