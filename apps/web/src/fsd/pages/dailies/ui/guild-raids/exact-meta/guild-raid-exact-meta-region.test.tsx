import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { GuildRaidExactReadinessRecommendationView } from "@/entities/guild-raid-meta"

import { GuildRaidExactMetaRegion } from "./guild-raid-exact-meta-region"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const source = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  name: "Terminus Maximus",
  url: "https://terminusmaximus.com/guild-raid/boss-meta/",
}

function lineup(
  id: string,
  label: string,
  teamReadiness: number | undefined
): GuildRaidExactReadinessRecommendationView {
  const hero = { id: "heroA", name: "Hero A", kind: "character" as const }
  return {
    id,
    kind: { id: label.toLowerCase(), label },
    efficiency: 1,
    comps: [],
    ...(teamReadiness === undefined
      ? {}
      : { status: "substitutes" as const, teamReadiness }),
    slots: [
      {
        kind: "hero",
        role: { id: "signature", label: "Signature" },
        essential: true,
        ideal: hero,
        picked: teamReadiness === undefined ? null : hero,
        isSubstitute: false,
        options: [],
      },
    ],
  }
}

describe("GuildRaidExactMetaRegion", () => {
  it("renders a loading skeleton", () => {
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "loading" }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-loading")
    ).toBeInTheDocument()
  })

  it("renders a retryable failed state", () => {
    const retry = vi.fn()
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "failed", retry }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-failed")
    ).toBeInTheDocument()
  })

  it("distinguishes an absent local Meta dataset from an unsupported boss", () => {
    const { unmount } = render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "absentMeta" }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-absent")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-exact-meta-no-boss")
    ).not.toBeInTheDocument()
    unmount()

    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{ status: "noBossRecommendation" }}
      />
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-no-boss")
    ).toBeInTheDocument()
  })

  it("shows ideal lineups with a sync prompt when the roster is missing", () => {
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{
          status: "missingRoster",
          source,
          updatedOn: "2026-07-01",
          threshold: null,
          recommendations: [lineup("rec-1", "Meta", undefined)],
        }}
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-roster-missing")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("guild-raid-exact-meta-no-target")
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Terminus Maximus" })
    ).toHaveAttribute("href", source.url)
  })

  it("shows the boss step's target once, above the lineups", () => {
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{
          status: "populated",
          source,
          updatedOn: "2026-07-01",
          threshold: {
            progression: "Legendary:RedThreeStars",
            requiredRank: "Diamond3",
            requiredRankIndex: 18,
            requiredProgressionIndex: 12,
            requiredAbilityLevel: 50,
          },
          recommendations: [lineup("rec-1", "Meta", 41)],
        }}
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-target")
    ).toHaveTextContent('guildRaids.exactMeta.targetAbilities:{"level":50}')
    expect(
      screen.queryByTestId("guild-raid-exact-meta-no-target")
    ).not.toBeInTheDocument()
  })

  it("explains missing percentages when there is no live target", () => {
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{
          status: "populated",
          source,
          updatedOn: "2026-07-01",
          threshold: null,
          recommendations: [lineup("rec-1", "Meta", undefined)],
        }}
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-no-target")
    ).toBeInTheDocument()
  })

  it("puts each authored lineup in its own tab, in authored order, with its team readiness", async () => {
    const user = userEvent.setup()
    render(
      <GuildRaidExactMetaRegion
        isMobile={false}
        query={{
          status: "populated",
          source,
          updatedOn: "2026-07-01",
          threshold: null,
          recommendations: [
            lineup("rec-lav", "Lavistodes", 41),
            lineup("rec-neuro", "Neuro", 69),
            lineup("rec-suit", "Battlesuit", 12),
          ],
        }}
      />
    )

    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Lavistodes41%",
      "Neuro69%",
      "Battlesuit12%",
    ])
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(screen.getAllByTestId("guild-raid-exact-meta-card")).toHaveLength(1)

    await user.click(tabs[1]!)
    expect(tabs[1]).toHaveAttribute("aria-selected", "true")
    expect(
      screen.getByTestId("guild-raid-exact-meta-team-readiness")
    ).toHaveTextContent('{"percent":69}')
  })

  it("explains how readiness is scored", async () => {
    const user = userEvent.setup()
    render(
      <GuildRaidExactMetaRegion
        isMobile
        query={{
          status: "populated",
          source,
          updatedOn: "2026-07-01",
          threshold: null,
          recommendations: [lineup("rec-1", "Meta", undefined)],
        }}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "guildRaids.exactMeta.howScored" })
    )
    expect(
      await screen.findByText("guildRaids.exactMeta.howScoredReadiness")
    ).toBeInTheDocument()
  })
})
