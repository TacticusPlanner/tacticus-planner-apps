import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { HreTeam } from "@/features/team-recommendations"
import { HreTeamCard } from "./hre-team-card"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      values
        ? `${key}|${Object.entries(values)
            .filter(([name]) => name !== "defaultValue")
            .map(([name, value]) => `${name}=${String(value)}`)
            .join(",")}`
        : key,
  }),
}))
vi.mock("../team-recs/team-list", () => ({
  TeamList: ({ members }: { members: unknown[] }) => (
    <div data-testid="hre-team-members">{members.length}</div>
  ),
}))

const ready = (
  deliveredSize: number
): Extract<HreTeam, { status: "ready" }> => ({
  status: "ready",
  rule: "ranged",
  eligibleCount: deliveredSize,
  alliance: "Chaos",
  support: null,
  hseUnits: null,
  team: {
    id: "plan",
    poolUsed: "full-roster",
    broadened: false,
    includedCappedCharacters: false,
    requestedSize: 8,
    deliveredSize,
    members: [],
  },
})

const renderCard = (
  team: HreTeam,
  tokens: number | null = null,
  hseEvent: string | null = null
) =>
  render(
    <HreTeamCard
      alliance="Xenos"
      hero="Zapspitta"
      missions={[]}
      hseEvent={hseEvent}
      plan={{
        mode: "onslaught",
        preferPsychic: false,
        reserve: { tokens: 1, missionNumber: 12 },
      }}
      tokens={tokens}
      view={{ status: "ready", team }}
    />
  )

describe("HreTeamCard", () => {
  it("titles an Onslaught pool by its mode and counts the units it holds", () => {
    renderCard(ready(6))
    expect(screen.getByText(/hre:teams.titleMode/)).toHaveTextContent(
      "mode=hre:tokens.modes.onslaught"
    )
    expect(screen.getByTestId("hre-team-rule")).toHaveTextContent(
      "hre:teams.rangedTrack|size=6,alliance=common:alliances.Chaos"
    )
  })

  it("does not promise spares when fewer than 5 units qualify", () => {
    renderCard(ready(4))
    expect(screen.getByTestId("hre-team-rule")).toHaveTextContent(
      "hre:teams.rangedTrackFew|size=4"
    )
  })

  it("says an ability-use pool has spares only beyond 5 units", () => {
    const abilities = (size: number): HreTeam => {
      const team = ready(size)
      return team.status === "ready" ? { ...team, rule: "abilities" } : team
    }
    const { unmount } = renderCard(abilities(8))
    expect(screen.getByTestId("hre-team-rule")).toHaveTextContent(
      "hre:teams.abilitiesTrack|size=8"
    )
    unmount()
    renderCard(abilities(5))
    expect(screen.getByTestId("hre-team-rule")).toHaveTextContent(
      "hre:teams.abilitiesTrackFew|size=5"
    )
  })

  it("titles a campaign team", () => {
    render(
      <HreTeamCard
        alliance="Xenos"
        hero="Zapspitta"
        missions={[]}
        plan={{ mode: "battle", preferPsychic: false, reserve: null }}
        tokens={null}
        view={{
          status: "ready",
          team: { ...ready(5), rule: "strongest", alliance: null },
        }}
      />
    )
    expect(screen.getByText("hre:teams.titleBattle")).toBeInTheDocument()
    expect(screen.getByTestId("hre-team-rule")).toHaveTextContent(
      "hre:teams.strongest"
    )
  })

  it("words a strongest-units Onslaught pool by its track", () => {
    renderCard({ ...ready(8), rule: "strongest" })
    expect(screen.getByTestId("hre-team-rule")).toHaveTextContent(
      "hre:teams.strongestTrack|size=8,alliance=common:alliances.Chaos"
    )
  })

  it("notes the tokens to keep and how many can be played now", () => {
    renderCard(ready(6), 3)
    expect(screen.getByTestId("hre-team-reserve")).toHaveTextContent(
      "hre:teams.reservePlay|have=3,play=2"
    )
  })

  it("notes how many units also score for a running HSE", () => {
    const withHse = (hseUnits: number): HreTeam => {
      const team = ready(8)
      return team.status === "ready" ? { ...team, hseUnits } : team
    }
    const { unmount } = renderCard(withHse(3), null, "Psyker Boost")
    expect(screen.getByTestId("hre-team-hse")).toHaveTextContent(
      "hre:teams.hse|count=3,event=Psyker Boost"
    )
    unmount()
    renderCard(withHse(0), null, "Psyker Boost")
    expect(screen.getByTestId("hre-team-hse")).toHaveTextContent(
      "hre:teams.hseNone|event=Psyker Boost"
    )
  })

  it("has no HSE note when the event does not score in the mode", () => {
    renderCard(ready(8), null, "Psyker Boost")
    expect(screen.queryByTestId("hre-team-hse")).not.toBeInTheDocument()
  })
})
