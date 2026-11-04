import userEvent from "@testing-library/user-event"
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
  it("shows the suggested team, its sustain and the eligible heroes", async () => {
    const team = [member("ultraCalgar"), member("ultraApothecary", ["Healer"])]
    const plans: IncursionPlans = {
      status: "ready",
      plans: new Map([
        [
          "tauBroadside",
          {
            tiers: new Map(),
            team: {
              status: "ready",
              team,
              teamPower: 12_345,
              sustained: true,
              eligible: [...team, member("ultraTigurius")],
            },
          },
        ],
      ]),
    }
    const user = userEvent.setup()
    render(<IncursionTeam incursion={broadside} plans={plans} />)

    const section = screen.getByTestId("incursion-tauBroadside-team")
    expect(section).toHaveTextContent("Power 12,345")
    expect(section).toHaveTextContent("Healer included")
    expect(
      screen
        .getByTestId("incursion-tauBroadside-team-members")
        .querySelectorAll("li")
    ).toHaveLength(2)

    await user.click(screen.getByTestId("incursion-tauBroadside-team-eligible"))
    expect(
      await screen.findByTestId("incursion-eligible-dialog")
    ).toBeInTheDocument()
    expect(screen.getAllByTestId("incursion-eligible-selected")).toHaveLength(2)
    expect(
      screen.getByTestId("incursion-eligible-ultraTigurius")
    ).toHaveAttribute("aria-pressed", "false")
  })

  it("says when the roster has too few allowed heroes", () => {
    render(
      <IncursionTeam
        incursion={broadside}
        plans={{
          status: "ready",
          plans: new Map([
            [
              "tauBroadside",
              {
                tiers: new Map(),
                team: { status: "tooFew", eligible: [] },
              },
            ],
          ]),
        }}
      />
    )
    expect(screen.getByTestId("incursion-tauBroadside-team")).toHaveTextContent(
      "You need at least 3 heroes from the allowed factions."
    )
  })
})
