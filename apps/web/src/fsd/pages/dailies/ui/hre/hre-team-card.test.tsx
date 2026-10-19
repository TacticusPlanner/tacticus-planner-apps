import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { HreTeam } from "../../model/hre-team-recommendations"
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

const ready = (deliveredSize: number): HreTeam => ({
  status: "ready",
  rule: "ranged",
  eligibleCount: deliveredSize,
  alliance: "Chaos",
  support: null,
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

const renderCard = (team: HreTeam, tokens: number | null = null) =>
  render(
    <HreTeamCard
      alliance="Xenos"
      hero="Zapspitta"
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

  it("notes the tokens to keep and how many can be played now", () => {
    renderCard(ready(6), 3)
    expect(screen.getByTestId("hre-team-reserve")).toHaveTextContent(
      "hre:teams.reservePlay|have=3,play=2"
    )
  })
})
