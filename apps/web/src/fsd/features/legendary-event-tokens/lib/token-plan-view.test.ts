import { describe, expect, it } from "vitest"

import { mark } from "./token-plan.fixtures"
import {
  buildTokenPlanView,
  nextTokenCardState,
  type TokenPlanReady,
} from "./token-plan-view"
import {
  WORKED_NOW,
  workedPlan,
  workedTeams,
  workedViewInput,
} from "./token-plan-view.fixtures"

const ready = (view: ReturnType<typeof buildTokenPlanView>) => {
  expect(view.kind).toBe("ready")
  return view as TokenPlanReady
}

describe("buildTokenPlanView", () => {
  it("plans the worked Uthar example with its next token, lanes and forecast", () => {
    const view = ready(buildTokenPlanView(workedViewInput()))

    expect(
      view.plan.tokens.map((token) => [
        token.teamId,
        token.battleIndex,
        token.points,
      ])
    ).toEqual([
      ["melee", 2, 240],
      ["melee", 3, 248],
      ["melee", 4, 252],
      ["five", 5, 191],
      ["melee", 1, 140],
      ["melee", 0, 65],
    ])
    expect(view.plan.totalPoints).toBe(1136)
    expect(view.next).toMatchObject({
      index: 0,
      reason: "mostPoints",
      token: { teamId: "melee", battleIndex: 2 },
    })
    expect(view.empty).toBeNull()
    expect(view.membersByTeam.get("melee")).toEqual([
      "ultraCalgar",
      "ultraTitus",
      "ultraApothecary",
    ])
    expect(view.fullClear).toEqual([
      {
        laneId: "alpha",
        figure: { kind: "uncovered", objectiveIndexes: [1, 2, 4] },
      },
    ])
    expect(view.forecast?.runs.at(-1)).toMatchObject({
      run: 3,
      endingPoints: 6136,
      shardsMissing: 75,
    })
    expect(view.leftover).toEqual({ tokens: 94, laneId: "alpha" })
    expect(view.upcomingRun).toBeNull()
    expect(nextTokenCardState(view)).toBe("token")
  })

  it("steers the plan with the plan's marks", () => {
    const view = ready(
      buildTokenPlanView(
        workedViewInput({
          plan: {
            enabled: true,
            status: "success",
            data: workedPlan(workedTeams, {
              annotations: [mark(2, 4, "maybeClear")],
            }),
          },
        })
      )
    )

    // Token 1 is flagged and tokens 2–4 need battle 3 won first.
    expect(view.next).toMatchObject({
      index: 4,
      reason: "mostPointsPlayableNow",
      token: { battleIndex: 1, points: 140 },
    })
  })

  it("names the Next run on an upcoming event", () => {
    const view = ready(
      buildTokenPlanView(
        workedViewInput({
          lifecycle: {
            state: "upcoming",
            runStartMs: WORKED_NOW + 24 * 60 * 60 * 1000,
            runEndMs: WORKED_NOW + 8 * 24 * 60 * 60 * 1000,
          },
        })
      )
    )

    expect(view.upcomingRun).toBe(3)
  })

  it.each([
    [
      "archived",
      workedViewInput({ lifecycle: { state: "archived" } }),
      "hidden",
    ],
    [
      "signed out",
      workedViewInput({
        plan: { enabled: false, status: "pending", data: undefined },
      }),
      "hidden",
    ],
    ["failed progress", workedViewInput({ progress: "error" }), "unavailable"],
    [
      "failed plan",
      workedViewInput({
        plan: { enabled: true, status: "error", data: undefined },
      }),
      "planError",
    ],
    ["loading progress", workedViewInput({ progress: "loading" }), "loading"],
    [
      "loading plan",
      workedViewInput({
        plan: { enabled: true, status: "pending", data: undefined },
      }),
      "loading",
    ],
    [
      "pending estimates",
      workedViewInput({ estimates: { kind: "pending" } }),
      "loading",
    ],
  ] as const)("is %s → %s", (_name, input, kind) => {
    expect(buildTokenPlanView(input).kind).toBe(kind)
  })

  it("names the first lane with points left without teams", () => {
    const view = ready(
      buildTokenPlanView(
        workedViewInput({
          plan: { enabled: true, status: "success", data: workedPlan([]) },
        })
      )
    )

    expect(view.empty).toEqual({ kind: "noTeams", laneId: "alpha" })
    expect(nextTokenCardState(view)).toBe("noTeams")
  })

  it("names the first team without a depth when none has one", () => {
    const view = ready(
      buildTokenPlanView(
        workedViewInput({ estimates: { kind: "hidden" }, run: 1 })
      )
    )

    expect(view.empty).toEqual({
      kind: "noDepth",
      laneId: "alpha",
      teamId: "five",
      teamName: "Five",
    })
  })

  it("names the lane with the most points left when the teams have nothing left", () => {
    const shallow = workedTeams.map((team) => ({
      ...team,
      objectiveIndexes: [],
      runDepths: [
        {
          run: 2 as const,
          expectedBattleClears: 1,
          expectedBattleClearsSource: "manual" as const,
          recordedAt: "2026-10-15T00:00:00Z",
        },
      ],
    }))
    const view = ready(
      buildTokenPlanView(
        workedViewInput({
          plan: { enabled: true, status: "success", data: workedPlan(shallow) },
          estimates: { kind: "hidden" },
        })
      )
    )

    expect(view.empty?.kind).toBe("nothingLeft")
    const most = Math.max(
      ...view.plan.lanes.map((lane) => lane.pointsLeftAfterPlan)
    )
    expect(view.empty).toMatchObject({ points: most })
  })

  it("has no forecast without the event's reward ladder", () => {
    const base = workedViewInput()
    const view = ready(
      buildTokenPlanView({
        ...base,
        event: { ...base.event, rewards: undefined! },
      })
    )

    expect(view.forecast).toBeNull()
    expect(view.plan.tokens).toHaveLength(6)
  })
})
