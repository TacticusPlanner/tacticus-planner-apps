import { useMemo } from "react"
import type {
  GameCatalogEventShop,
  ResolvedEventSlot,
} from "@workspace/game-catalog"
import type { Rarity } from "@workspace/game-domain"

import { useGlobalGoalPlan } from "@/entities/goal"
import { usePlanInsights } from "@/features/goal-planning"
import { buildCoverage, toCoverageNeeds } from "@/features/shops/event-planner"
import type {
  ClassifiedEntry,
  CoverageRow,
  XpPerBook,
} from "@/features/shops/event-planner"
import { useShopNeeds } from "@/features/shops/recommendations"
import { useCatalogDataset } from "@/shared/local-data"

export type EventShopCoverageState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  /** No Active goals in the scope. */
  | { status: "noGoals" }
  | {
      status: "ready"
      rows: CoverageRow[]
      /** Raw XP per book, to show the XP row as books of `xpBookRarity`. */
      xpPerBook: XpPerBook
      xpBookRarity: Rarity | null
    }

const toXpPerBook = (
  records: readonly {
    xpBooks: readonly { rarity: Rarity; xpIncrease: number }[]
  }[]
): XpPerBook =>
  Object.fromEntries(
    (records[0]?.xpBooks ?? []).map((book) => [book.rarity, book.xpIncrease])
  )

/**
 * Coverage of the Active goals' needs in `projectId` (all goals when undefined) by the event (spec
 * event-shop-planner: Coverage of goal needs): shards, mythic shards and Mythic materials from the shop
 * need aggregation, the rest from the plan's missing resources.
 */
export function useEventShopCoverage({
  event,
  entries,
  todayIndex,
  projectId,
  slotsByDay,
}: {
  event: GameCatalogEventShop
  entries: readonly ClassifiedEntry[]
  todayIndex: number
  projectId: string | undefined
  /** Each day's purchasable slots for the roster, resolved once by the page (see `purchasableSlotsByDay`). */
  slotsByDay: readonly (readonly ResolvedEventSlot[])[]
}): EventShopCoverageState {
  const needs = useShopNeeds(projectId)
  const globalPlan = useGlobalGoalPlan()
  const scopeGoalIds = useMemo(
    () =>
      projectId
        ? globalPlan.entries
            .filter((entry) => entry.goal.projectIds.includes(projectId))
            .map((entry) => entry.goal.goalId)
        : null,
    [globalPlan.entries, projectId]
  )
  const insights = usePlanInsights(scopeGoalIds)
  const xpRead = useCatalogDataset("progression-rules", toXpPerBook)
  const xpPerBook = xpRead.status === "ready" ? xpRead.data : undefined

  // Depends on the aggregate, not the whole state, so a goal-count-only change doesn't rebuild coverage.
  const shopNeeds = needs.status === "ready" ? needs.needs : null
  const rows = useMemo(() => {
    if (!shopNeeds || insights.loading || !xpPerBook) return null
    return buildCoverage({
      needs: toCoverageNeeds(shopNeeds, insights.result.missing),
      entries,
      todayIndex,
      dayCount: event.dayCount,
      slotsOnDay: (dayIndex) => slotsByDay[dayIndex] ?? [],
      xpPerBook,
    })
  }, [
    shopNeeds,
    insights.loading,
    insights.result.missing,
    xpPerBook,
    entries,
    todayIndex,
    event.dayCount,
    slotsByDay,
  ])

  if (
    needs.status === "error" ||
    insights.isError ||
    xpRead.status === "error"
  ) {
    return {
      status: "error",
      retry: () => {
        if (needs.status === "error") needs.retry()
        insights.retry()
        xpRead.retry()
      },
    }
  }
  if (needs.status === "ready" && needs.activeGoalCount === 0) {
    return { status: "noGoals" }
  }
  if (!rows || !xpPerBook) return { status: "loading" }
  return {
    status: "ready",
    rows,
    xpPerBook,
    xpBookRarity: insights.result.missing.xpBooks?.rarity ?? null,
  }
}
