import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@/test/render"

/**
 * Render-count harness for the drag-lag fix: with many rows, starting a drag / moving over another
 * row must not re-render every row's content (chips, catalog hooks, row-action hooks). jsdom has no
 * layout, so row rects are stubbed from each row's index to give dnd-kit real collisions.
 */
const counts = vi.hoisted(() => ({ chips: 0, catalog: 0, move: 0 }))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({ useIsMobile: () => false }))

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      setValue(querier())
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: "en" },
  }),
}))

vi.mock("@workspace/player-data/queries", () => ({
  getCampaignProgress: () => [],
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => new Map(),
  getMowsMap: () => new Map(),
  getUpgrades: () => [],
  getCampaignBattles: () => [],
  getCampaignDefinitions: () => [],
  getAscensionCostsMap: () => new Map(),
  getUnlockShardCostsMap: () => new Map(),
  getMowUpgradeCosts: () => [],
  getCharacterAbilityCosts: () => [],
}))

vi.mock("../shared/goal-resource-chips", () => ({
  GoalResourceChips: () => {
    counts.chips++
    return null
  },
}))

vi.mock("../../model/shared/use-goal-catalog", async (importActual) => {
  const actual =
    await importActual<typeof import("../../model/shared/use-goal-catalog")>()
  return {
    ...actual,
    useGoalCatalog: () => {
      counts.catalog++
      return actual.useGoalCatalog()
    },
  }
})

vi.mock(
  "../../model/projects/use-move-goal-from-project",
  async (importActual) => {
    const actual =
      await importActual<
        typeof import("../../model/projects/use-move-goal-from-project")
      >()
    return {
      ...actual,
      useMoveGoalFromProject: () => {
        counts.move++
        return actual.useMoveGoalFromProject()
      },
    }
  }
)

import type { GoalRow } from "../../model/shared/types"
import type { useGoalActions } from "../../model/goals-data/use-goal-actions"
import { GoalsList } from ".//goals-list"

const ROWS = 30
const rows: GoalRow[] = Array.from({ length: ROWS }, (_, i) => ({
  goalId: `goal-${i}`,
  entityType: "Character",
  entityId: `hero${i}`,
  goalType: "Rank",
  status: "Active",
  priority: i + 1,
  notes: null,
  updatedAt: "2026-07-15T00:00:00Z",
}))

const actions = {
  setStatus: vi.fn(),
  remove: vi.fn(),
  pendingIds: new Set<string>(),
} as unknown as ReturnType<typeof useGoalActions>

beforeEach(() => {
  Element.prototype.getBoundingClientRect = function () {
    const id = (this as HTMLElement).getAttribute?.("data-goal-id")
    const top = id ? Number(id.split("-")[1]) * 56 : 0
    return {
      top,
      bottom: top + 56,
      left: 0,
      right: 800,
      width: 800,
      height: id ? 56 : 0,
      x: 0,
      y: top,
      toJSON: () => ({}),
    } as DOMRect
  }
})

describe("GoalsList drag performance", () => {
  it("does not re-render every row on drag start / over change", async () => {
    const onReorder = vi.fn()
    render(
      <GoalsList
        actions={actions}
        onReorder={onReorder}
        reorderEnabled
        rows={rows}
      />
    )
    const handles = await screen.findAllByTestId("goal-row-drag-handle")
    const reset = () => {
      counts.chips = 0
      counts.catalog = 0
      counts.move = 0
    }
    const snapshot = () => ({ ...counts })

    reset()
    handles[10]!.focus()
    await act(async () => {
      fireEvent.keyDown(handles[10]!, { code: "Space", key: " " })
    })
    const start = snapshot()
    reset()
    await act(async () => {
      fireEvent.keyDown(document, { code: "ArrowDown", key: "ArrowDown" })
    })
    const overOnce = snapshot()
    reset()
    await act(async () => {
      fireEvent.keyDown(document, { code: "ArrowDown", key: "ArrowDown" })
    })
    const overTwice = snapshot()
    await act(async () => {
      fireEvent.keyDown(document, { code: "Space", key: " " })
    })

    expect(onReorder).toHaveBeenCalled()
    // Only the rows whose sortable state changed may re-render their content.
    expect(start.chips).toBeLessThanOrEqual(2)
    expect(overOnce.chips + overTwice.chips).toBeLessThanOrEqual(2)
    expect(start.move + overOnce.move + overTwice.move).toBeLessThanOrEqual(3)
  })
})
