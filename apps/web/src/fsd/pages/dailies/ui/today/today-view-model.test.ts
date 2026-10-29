import { battleIdSchema } from "@workspace/game-domain"
import { describe, expect, it } from "vitest"

import { battle, offPlanBattle, ready } from "@/test/fixtures/daily-raids"

import { BONUS_LIMIT, BONUS_STEP, buildTodayView } from "./today-view-model"

describe("buildTodayView", () => {
  it("shows the top 3 bonus entries below the limit, then up to 5 more per step", () => {
    const base = ready()
    // 12 bonus entries: 3, then 3 + 5 = 8, then the last 4.
    const raids = ready({
      bonus: {
        ...base.bonus,
        entries: Array.from({ length: 12 }, (_, index) => ({
          ...base.bonus.entries[0]!,
          resourceId: `B${index}` as never,
        })),
      },
    })

    const first = buildTodayView(raids)
    expect(first.bonusShown).toHaveLength(BONUS_LIMIT)
    expect(first.bonusMoreCount).toBe(BONUS_STEP)
    expect(first.bonusCanShowLess).toBe(false)

    const second = buildTodayView(raids, {
      bonusShownCount: BONUS_LIMIT + BONUS_STEP,
    })
    expect(second.bonusShown).toHaveLength(8)
    expect(second.bonusMoreCount).toBe(4)
    expect(second.bonusCanShowLess).toBe(true)

    const all = buildTodayView(raids, {
      bonusShownCount: BONUS_LIMIT + 2 * BONUS_STEP,
    })
    expect(all.bonusShown).toHaveLength(12)
    expect(all.bonusMoreCount).toBe(0)
    expect(all.bonusCanShowLess).toBe(true)
  })

  it("shows every bonus entry once the energy limit is reached, with no Show more", () => {
    const view = buildTodayView(
      ready({ dailyEnergy: 288, realEnergyUsedToday: 288 })
    )

    expect(view.selection.planEntries).toEqual([])
    // raidsLeftToday: 2 plan entries + 4 bonus entries.
    expect(view.bonusShown).toHaveLength(6)
    expect(view.bonusMoreCount).toBe(0)
    expect(view.bonusCanShowLess).toBe(false)
    expect(view.energy.overLimit).toBe(true)
  })

  it("counts only location rows with real attempts left", () => {
    const exhausted = battleIdSchema.parse("B9")
    const base = ready()
    const view = buildTodayView(
      ready({
        today: {
          ...base.today,
          entries: [
            ...base.today.entries,
            { ...base.today.entries[0]!, battleId: exhausted },
          ],
        },
        attemptsLeftByBattle: new Map([
          [battle, 3],
          [exhausted, 0],
        ]),
      })
    )

    // Two entries at B1 (one per goal), the B9 entry is spent.
    expect(view.planNodeCount).toBe(2)
  })

  it("prefers the plan's resource for a node, first entry first", () => {
    const view = buildTodayView(ready())

    // B1 is farmed for U1 (Ceramite) by the first plan entry, ahead of the bonus entries there.
    expect(view.planResourceByBattle.get(battle)?.label).toBe("Ceramite")
    // B2 is only in the catalog index, which the attempts card reads separately.
    expect(view.planResourceByBattle.has(offPlanBattle)).toBe(false)
  })

  it("rounds today's Onslaught runs up to whole tokens", () => {
    const base = ready()
    const view = buildTodayView(
      ready({
        today: {
          ...base.today,
          onslaughtEntries: [
            { goalId: "g1", runs: 1.2, expectedShards: 6 },
            { goalId: "g2", runs: 0.5, expectedShards: 2 },
          ],
        },
      })
    )

    expect(view.onslaughtRuns.map((run) => run.unit.unitId)).toEqual([
      "bellator",
      "alephNull",
    ])
    // 1.2 + 0.5 = 1.7 expected runs need 2 whole tokens.
    expect(view.onslaughtTokens).toBe(2)
  })

  it("keeps the energy percentage uncapped", () => {
    const view = buildTodayView(
      ready({ dailyEnergy: 638, realEnergyUsedToday: 663 })
    )

    // 663 / 638 = 103.9%.
    expect(view.energy.percent).toBeCloseTo(103.9, 1)
    expect(view.energy.overLimit).toBe(true)
  })

  it("treats a daily energy of 0 as no limit", () => {
    const view = buildTodayView(
      ready({ dailyEnergy: 0, realEnergyUsedToday: 400 })
    )

    expect(view.energy).toEqual({
      used: 400,
      daily: 0,
      percent: 0,
      overLimit: false,
    })
    expect(view.selection.planEntries).toHaveLength(2)
  })

  it("totals today's attempts", () => {
    const nodes = ["N1", "N2", "N3", "N4", "N5"].map((id) =>
      battleIdSchema.parse(id)
    )
    const view = buildTodayView(
      ready({
        todaysAttempts: [6, 6, 10, 5, 2].map((attemptsUsed, index) => ({
          battleId: nodes[index]!,
          attemptsUsed,
          attemptsLeft: 0,
        })),
      })
    )

    // 6 + 6 + 10 + 5 + 2 = 29 attempts over 5 nodes.
    expect(view.attempts).toEqual({ rows: 5, total: 29 })
  })

  it("passes the energy used of the daily energy and the location emphasis through", () => {
    const view = buildTodayView(ready())

    expect(view.energy).toMatchObject({ used: 120, daily: 288 })
    expect(view.scheduleProps.emphasis).toBe("location")
  })
})
