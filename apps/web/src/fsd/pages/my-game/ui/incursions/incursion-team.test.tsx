import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import { render, screen } from "@/test/render"

import type { IncursionPlans } from "../../model/use-incursion-plans"
import { IncursionTeam } from "./incursion-team"

const broadside = incursionsFixture.find(
  (incursion) => incursion.mowId === "tauBroadside"
)!

const member = (id: string, traits: string[] = []) => ({
  id,
  faction: "Ultramarines",
  traits,
  power: 1000,
})

describe("IncursionTeam", () => {
  it("shows the suggested team, its sustain and the tiers it clears", () => {
    const plans: IncursionPlans = {
      status: "ready",
      plans: new Map([
        [
          "tauBroadside",
          {
            team: [
              member("ultraCalgar"),
              member("ultraApothecary", ["Healer"]),
            ],
            teamPower: 12_345,
            sustained: true,
            tiers: new Map([
              [0, { wins: 12, battles: 12, cleared: true, hpLeftPct: 40 }],
              [12, { wins: 3, battles: 15, cleared: false, hpLeftPct: 5 }],
            ]),
          },
        ],
      ]),
    }
    render(<IncursionTeam incursion={broadside} plans={plans} />)

    const team = screen.getByTestId("incursion-tauBroadside-team")
    expect(team).toHaveTextContent("Power 12,345")
    expect(team).toHaveTextContent("Healer included")
    expect(
      screen.getByTestId("incursion-tauBroadside-team-clearable")
    ).toHaveTextContent("Estimated to clear 1 of 2 tiers, up to Common 1")
    expect(
      screen
        .getByTestId("incursion-tauBroadside-team-members")
        .querySelectorAll("li")
    ).toHaveLength(2)
  })

  it("says when the roster has too few allowed heroes", () => {
    render(
      <IncursionTeam
        incursion={broadside}
        plans={{ status: "ready", plans: new Map([["tauBroadside", null]]) }}
      />
    )
    expect(screen.getByTestId("incursion-tauBroadside-team")).toHaveTextContent(
      "You need at least 3 heroes from the allowed factions."
    )
  })
})
