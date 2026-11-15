import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import { forecastRuns, type ForecastInput } from "./run-forecast"
import { compareRisk, safestNextToken, type TokenRisk } from "./safest-next"
import { planTokens, type PlannedToken } from "./token-plan"
import { workedLanes } from "./token-plan.fixtures"

// Uthar Alpha (worked example): the most-points plan opens with Melee on battle 3 (+240), and
// battle 2 (+140) and battle 1 (+65) are playable now too. Milestone 13 sits at 5,500 points and
// pays 85 currency: enough for the first chest (60), whose 25 shards take 375 to Unlock (400).
const setup = (points: number, tokens = 1) => {
  const planInput = { lanes: workedLanes(), startingPoints: points }
  const forecastInput: Omit<ForecastInput, "tokens"> = {
    rewards: utharEvent.rewards,
    ohSoCloseOffer: utharEvent.ohSoCloseOffer,
    progress: {
      currentPoints: points,
      currentCurrency: 0,
      currentClaimedChestIndex: 0,
      currentShards: 375,
      extraCurrencyPerPayout: null,
    },
    supply: [
      {
        run: 1,
        state: "now",
        unknownRun: false,
        free: tokens,
        ad: 0,
        adTodayPending: false,
        bonusDelivery: 0,
        total: tokens,
      },
    ],
    fromStep: "unlock",
    runs: undefined,
    showPaidOptions: false,
  }
  const plan = planTokens(planInput)
  return {
    planInput,
    plan,
    forecast: forecastRuns({ ...forecastInput, tokens: plan.tokens }),
    forecastInput,
  }
}

/** Melee's depth 5 (Five's 6): the deeper the battle, the less headroom. */
const riskOf = (
  token: Pick<PlannedToken, "teamId" | "battleIndex">
): TokenRisk => ({
  band: 0,
  headroom: (token.teamId === "melee" ? 5 : 6) - token.battleIndex - 1,
})

const head = (plan: { tokens: PlannedToken[] }) => {
  const token = plan.tokens[0]!
  return [token.teamId, token.battleIndex + 1, token.points]
}

describe("safestNextToken", () => {
  it("plays the safest battle that still reaches the run's milestone and step", () => {
    // 100 points to milestone 13: Five on battle 3 (+175) gets there with more headroom than
    // Melee (Five reaches battle 6); Melee on battle 2 (+140) is as safe but earns less.
    const base = setup(5400)
    expect(head(base.plan)).toEqual(["melee", 3, 240])

    const safest = safestNextToken({ ...base, riskOf })

    expect(safest?.goal).toEqual({
      milestone: 13,
      points: 5500,
      step: "unlock",
    })
    expect(head(safest!.plan)).toEqual(["five", 3, 175])
    expect(safest!.forecast.runs[0]?.stepsReached).toEqual(["unlock"])
  })

  it("keeps the most-points plan when only its battle reaches the milestone", () => {
    // 200 points to milestone 13: only battle 3 (+240) gets there.
    expect(safestNextToken({ ...setup(5300), riskOf })).toBeNull()
  })

  it("keeps the most-points plan when the run crosses no milestone", () => {
    expect(safestNextToken({ ...setup(5000), riskOf })).toBeNull()
  })

  it("weighs every token the run still has", () => {
    // Two tokens from 5,300: the plan plays Melee on battles 3 and 4 (+488), battle 4 at the edge
    // of Melee's depth. Battles 2 and 3 (+380) still reach milestone 13 without battle 4.
    const base = setup(5300, 2)
    expect(
      base.plan.tokens.slice(0, 2).map((token) => token.battleIndex + 1)
    ).toEqual([3, 4])

    const safest = safestNextToken({ ...base, riskOf })

    expect(
      safest?.plan.tokens
        .slice(0, 2)
        .map((token) => [token.teamId, token.battleIndex + 1])
    ).toEqual([
      ["melee", 2],
      ["melee", 3],
    ])
    expect(safest?.goal.milestone).toBe(13)
  })
})

describe("compareRisk", () => {
  it("ranks a likely clear riskier than any safe clear, then less headroom", () => {
    expect(
      compareRisk({ band: 0, headroom: 0 }, { band: 1, headroom: 5 })
    ).toBeLessThan(0)
    expect(
      compareRisk({ band: 0, headroom: 3 }, { band: 0, headroom: 1 })
    ).toBeLessThan(0)
  })
})
