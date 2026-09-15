import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type {
  GuildRaidExactReadinessRecommendationView,
  GuildRaidMetaSourcePresentation,
  GuildRaidRecommendationReadiness,
} from "@/entities/guild-raid-meta"

import { GuildRaidExactMetaCard } from "./guild-raid-exact-meta-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    i18n: { language: "en" },
  }),
}))

const source: GuildRaidMetaSourcePresentation = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  name: "Terminus Maximus",
  url: "https://terminusmaximus.com/guild-raid/boss-meta/",
}

function recommendation(
  overrides: Partial<GuildRaidExactReadinessRecommendationView> = {}
): GuildRaidExactReadinessRecommendationView {
  return {
    id: "rec-1",
    kind: "meta",
    heroes: [
      { id: "heroA", name: "Hero A", kind: "character", owned: true },
      { id: "heroB", name: "Hero B", kind: "character", owned: true },
      { id: "heroC", name: "Hero C", kind: "character", owned: false },
      { id: "heroD", name: "Hero D", kind: "character", owned: false },
      { id: "heroE", name: "Hero E", kind: "character", owned: false },
    ],
    mow: { id: "mowX", name: "Mow X", kind: "mow", owned: true },
    comps: [
      {
        id: "comp1",
        signature: { id: "heroA", name: "Hero A", kind: "character" },
      },
    ],
    classification: "partial",
    ...overrides,
  }
}

function readinessFixture(
  overrides: Partial<GuildRaidRecommendationReadiness> = {}
): GuildRaidRecommendationReadiness {
  const heroIds = ["heroA", "heroB", "heroC", "heroD", "heroE"]
  return {
    // The card never reads `recommendation` off the readiness object (it reads its own
    // `recommendation` prop directly) — an empty stub is enough here.
    recommendation: {} as GuildRaidRecommendationReadiness["recommendation"],
    teamReadiness: 100,
    heroSlots: heroIds.map((heroId, index) => ({
      heroId,
      roleId: index === 0 ? "signature" : "flex",
      essential: index === 0,
      assignment: { characterId: heroId, isIdeal: true },
      readiness: 100,
      candidates: [],
    })),
    mow: { mowId: "mowX", owned: true, readiness: 100 },
    ...overrides,
  }
}

describe("GuildRaidExactMetaCard", () => {
  it("shows the kind badge, classification, lineup, Comps, and source on desktop", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-kind-badge")
    ).toHaveTextContent("guildRaids.exactMeta.kind.meta")
    expect(
      screen.getByTestId("guild-raid-exact-meta-classification-badge")
    ).toHaveTextContent("guildRaids.exactMeta.readiness.partial")
    expect(
      screen.getAllByTestId("guild-raid-exact-meta-hero-owned")
    ).toHaveLength(2)
    expect(
      screen.getAllByTestId("guild-raid-exact-meta-hero-missing")
    ).toHaveLength(3)
    expect(
      screen.getByTestId("guild-raid-exact-meta-mow-owned")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-comps")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-source")
    ).toHaveTextContent("guildRaids.exactMeta.sourceLabel")
  })

  it("shows every classification badge variant", () => {
    for (const classification of ["ready", "partial", "unavailable"] as const) {
      const { unmount } = render(
        <GuildRaidExactMetaCard
          isMobile={false}
          recommendation={recommendation({ classification })}
          source={source}
          updatedOn="2026-07-01"
        />
      )
      expect(
        screen.getByTestId("guild-raid-exact-meta-classification-badge")
      ).toHaveTextContent(`guildRaids.exactMeta.readiness.${classification}`)
      unmount()
    }
  })

  it("shows a readiness-unknown badge and no owned/missing decoration when roster is unavailable", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation({
          classification: undefined,
          heroes: recommendation().heroes.map((hero) => ({
            ...hero,
            owned: undefined,
          })),
          mow: { ...recommendation().mow, owned: undefined },
        })}
        source={source}
        updatedOn="2026-07-01"
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-classification-badge")
    ).toHaveTextContent("guildRaids.exactMeta.readiness.unknown")
    expect(
      screen.getAllByTestId("guild-raid-exact-meta-hero-unknown")
    ).toHaveLength(5)
    expect(
      screen.getByTestId("guild-raid-exact-meta-mow-unknown")
    ).toBeInTheDocument()
  })

  it("preserves authored heroIds order on both desktop and mobile", () => {
    const { unmount } = render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )
    expect(screen.getByTestId("guild-raid-exact-meta-heroes").textContent).toBe(
      "Hero AguildRaids.exactMeta.ownership.ownedHero BguildRaids.exactMeta.ownership.ownedHero CguildRaids.exactMeta.ownership.missingHero DguildRaids.exactMeta.ownership.missingHero EguildRaids.exactMeta.ownership.missingMow XguildRaids.exactMeta.ownership.owned"
    )
    unmount()

    render(
      <GuildRaidExactMetaCard
        isMobile={true}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )
    expect(screen.getByTestId("guild-raid-exact-meta-heroes").textContent).toBe(
      "Hero AguildRaids.exactMeta.ownership.ownedHero BguildRaids.exactMeta.ownership.ownedHero CguildRaids.exactMeta.ownership.missingHero DguildRaids.exactMeta.ownership.missingHero EguildRaids.exactMeta.ownership.missingMow XguildRaids.exactMeta.ownership.owned"
    )
  })

  it("puts classification and missing count before the lineup on mobile, with Comps/source collapsed", async () => {
    const user = userEvent.setup()
    render(
      <GuildRaidExactMetaCard
        isMobile={true}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-missing-count")
    ).toHaveTextContent('guildRaids.exactMeta.missingCount:{"count":3}')
    expect(
      screen.queryByTestId("guild-raid-exact-meta-source")
    ).not.toBeInTheDocument()

    await user.click(screen.getByTestId("guild-raid-exact-meta-details-toggle"))

    expect(
      screen.getByTestId("guild-raid-exact-meta-source")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("guild-raid-exact-meta-comps")
    ).toBeInTheDocument()
  })

  it("shows a 100% team-readiness badge for a fully-ready recommendation", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
        readiness={readinessFixture()}
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-team-readiness")
    ).toHaveTextContent('guildRaids.exactMeta.teamReadiness:{"percent":100}')
  })

  it("shows each hero's and the Machine of War's own readiness percentage badge", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
        readiness={readinessFixture({
          heroSlots: readinessFixture().heroSlots.map((slot, index) => ({
            ...slot,
            readiness: [100, 60, 0, 0, 0][index]!,
          })),
        })}
      />
    )

    const heroReadinessBadges = screen.getAllByTestId(
      "guild-raid-exact-meta-hero-readiness"
    )
    expect(heroReadinessBadges.map((el) => el.textContent)).toEqual([
      "100%",
      "60%",
      "0%",
      "0%",
      "0%",
    ])
    expect(
      screen.getByTestId("guild-raid-exact-meta-mow-readiness")
    ).toHaveTextContent("100%")
  })

  it("shows a 0% team-readiness badge for an unready recommendation without crashing", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation({
          heroes: recommendation().heroes.map((hero) => ({
            ...hero,
            owned: false,
          })),
          mow: { ...recommendation().mow, owned: false },
          classification: "unavailable",
        })}
        source={source}
        updatedOn="2026-07-01"
        readiness={readinessFixture({
          teamReadiness: 0,
          heroSlots: readinessFixture().heroSlots.map((slot) => ({
            ...slot,
            assignment: null,
            readiness: 0,
          })),
          mow: { mowId: "mowX", owned: false, readiness: 0 },
        })}
      />
    )

    expect(
      screen.getByTestId("guild-raid-exact-meta-team-readiness")
    ).toHaveTextContent('guildRaids.exactMeta.teamReadiness:{"percent":0}')
  })

  it("shows every owned candidate's percentage for a flex slot, not only the selected one", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
        readiness={readinessFixture({
          heroSlots: readinessFixture().heroSlots.map((slot, index) =>
            index === 1
              ? {
                  ...slot,
                  candidates: [
                    {
                      characterId: "heroB",
                      readiness: 40,
                      isIdeal: true,
                      isSelected: true,
                    },
                    {
                      characterId: "altB",
                      readiness: 90,
                      isIdeal: false,
                      isSelected: false,
                    },
                  ],
                }
              : slot
          ),
        })}
      />
    )

    const candidates = screen.getByTestId("guild-raid-exact-meta-candidates-1")
    expect(candidates).toHaveTextContent("heroB")
    expect(candidates).toHaveTextContent("40%")
    expect(candidates).toHaveTextContent("altB")
    expect(candidates).toHaveTextContent("90%")
  })

  it("shows no candidate comparison for an essential slot whose ideal hero already fills it", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
        readiness={readinessFixture({
          heroSlots: readinessFixture().heroSlots.map((slot, index) =>
            index === 0
              ? {
                  ...slot,
                  candidates: [
                    {
                      characterId: "heroA",
                      readiness: 100,
                      isIdeal: true,
                      isSelected: true,
                    },
                  ],
                }
              : slot
          ),
        })}
      />
    )

    expect(
      screen.queryByTestId("guild-raid-exact-meta-candidates-0")
    ).not.toBeInTheDocument()
  })

  it("wraps heroes and candidates instead of forcing horizontal scroll below 768px", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={true}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
        readiness={readinessFixture({
          heroSlots: readinessFixture().heroSlots.map((slot, index) =>
            index === 1
              ? {
                  ...slot,
                  candidates: [
                    {
                      characterId: "heroB",
                      readiness: 40,
                      isIdeal: true,
                      isSelected: true,
                    },
                    {
                      characterId: "altB",
                      readiness: 90,
                      isIdeal: false,
                      isSelected: false,
                    },
                  ],
                }
              : slot
          ),
        })}
      />
    )

    expect(screen.getByTestId("guild-raid-exact-meta-heroes")).toHaveClass(
      "flex-wrap"
    )
    expect(
      screen.getByTestId("guild-raid-exact-meta-candidates-1")
    ).toHaveClass("flex-wrap")
  })

  it("puts the team-readiness summary before the collapsible lineup detail on mobile, matching the modified spec's ordering", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={true}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
        readiness={readinessFixture()}
      />
    )

    const card = screen.getByTestId("guild-raid-exact-meta-card")
    const summaryPosition = card
      .querySelector('[data-testid="guild-raid-exact-meta-team-readiness"]')!
      .compareDocumentPosition(
        screen.getByTestId("guild-raid-exact-meta-heroes")
      )

    // The team-readiness badge (part of the summary block) precedes the heroes lineup in DOM order —
    // Node.DOCUMENT_POSITION_FOLLOWING (4) on the heroes element relative to the badge confirms this.
    expect(summaryPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("renders without a readiness prop, unchanged from the ownership-only display", () => {
    render(
      <GuildRaidExactMetaCard
        isMobile={false}
        recommendation={recommendation()}
        source={source}
        updatedOn="2026-07-01"
      />
    )

    expect(
      screen.queryByTestId("guild-raid-exact-meta-team-readiness")
    ).not.toBeInTheDocument()
  })
})
