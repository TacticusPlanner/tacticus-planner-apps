import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { vi } from "vitest"

import { screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"
import { hseFixturePlayer } from "@/test/fixtures/hse-event-points"
import { hseInstance, hseTestI18n, renderHse } from "@/test/fixtures/hse-render"

let i18n: I18n
beforeAll(async () => {
  i18n = await hseTestI18n()
})
beforeEach(() => {
  window.localStorage.clear()
  setViewportWidth(1024)
})
afterEach(() => vi.unstubAllGlobals())

const descriptionLines = () =>
  within(screen.getByTestId("hse-event-details-description"))
    .getAllByRole("listitem")
    .map((item) => item.textContent)

describe("EventDetails", () => {
  it("reads Psyker Boost's description in English, XP first", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))

    expect(descriptionLines()).toEqual([
      "Psyker characters gain 3x XP in Arena, Onslaught, and Salvage Run.",
      "Psyker characters have +20% Health, +20% Damage and +20% Armour in Arena.",
      "You gain 1 point for each enemy unit (excluding Summons) you defeat with Psyker units in Arena, Onslaught, and Salvage Run.",
    ])
  })

  it("reads it in German too", async () => {
    const de = await hseTestI18n("de")
    renderHse(de, hseInstance("hse-trait-boost-psyker", "upcoming"))

    expect(descriptionLines()[0]).toBe(
      "Psyker-Charaktere erhalten 3x XP in Arena, Onslaught und Plünderungslauf."
    )
  })

  it("states Faction Boost's faction and alliance trackers", () => {
    renderHse(
      i18n,
      hseInstance("hse-faction-boost", "upcoming", {
        targetFactionId: "DarkAngels",
      })
    )

    expect(descriptionLines()).toEqual([
      "Dark Angels characters gain 2x XP in Arena, Onslaught, and Salvage Run when the whole team is from one faction.",
      "Dark Angels characters have +20% Health, +20% Damage and +20% Armour in Arena.",
      "You gain 2 points for each enemy unit (excluding Summons) you defeat with Imperial characters in Arena, Onslaught, and Salvage Run.",
      "You gain 1 point for each enemy unit (excluding Summons) you defeat with Dark Angels characters in Arena, Onslaught, and Salvage Run.",
    ])
  })

  it("names For the Emperor's excluded enemies and Squig Smash's target", () => {
    const { unmount } = renderHse(
      i18n,
      hseInstance("hse-for-the-emperor", "upcoming")
    )
    expect(descriptionLines()).toEqual([
      "You gain 1 point for each enemy unit (excluding Imperial and Summons) you defeat with Imperial units in Arena, Onslaught, and Salvage Run.",
    ])
    unmount()

    renderHse(i18n, hseInstance("hse-squig-smash", "upcoming"))
    expect(descriptionLines()[0]).toMatch(
      /^You gain 1 point for each Large Squig you defeat in Arena, Tournament Arena, Onslaught, Salvage Run, Survival/
    )
  })

  it("shows the power level and resolved tier, with the tier rules in a tooltip", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))

    const tier = screen.getByTestId("hse-event-details-tier")
    expect(tier).toHaveTextContent("Power level: 62")
    expect(tier).toHaveTextContent("Your tier: High")
    await userEvent.hover(screen.getByTestId("hse-event-details-tier-rules"))
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Low: power level below 20")
    expect(tooltip).toHaveTextContent(
      "High: power level 20 or more, with a character or Machine of War at Legendary one blue star or above"
    )
  })

  it("resolves Mid for power level 35 without a blue-star unit (final milestone 605)", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"), {
      reads: {
        player: () =>
          hseFixturePlayer({
            player: { powerLevel: 35, hasBlueStarUnit: false },
          }),
      },
    })
    expect(screen.getByTestId("hse-event-details-tier")).toHaveTextContent(
      "Your tier: Mid"
    )
    expect(screen.getByTestId("hse-projection-target")).toHaveTextContent(
      "605 pts"
    )
  })

  it("shows neither power level nor tier for a single-tier run (Faction Focus october-2026)", () => {
    renderHse(
      i18n,
      hseInstance("hse-faction-focus", "upcoming", {
        hseVariant: "october-2026",
      })
    )
    expect(
      screen.queryByTestId("hse-event-details-tier")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("hse-projection-target")).toHaveTextContent(
      "1,220 pts"
    )
  })

  it("labels a Global event and shows its Default tier", () => {
    renderHse(i18n, hseInstance("hse-global-operation-imperator", "running"))
    expect(screen.getByTestId("hse-event-details-global")).toHaveTextContent(
      "Community event: the milestones count the points of every player together."
    )
    expect(screen.getAllByTestId("hse-milestone")).toHaveLength(5)
    expect(screen.queryByTestId("hse-projection")).not.toBeInTheDocument()
  })

  it("says milestone data is not available without config.hse (Against the Tide)", () => {
    renderHse(i18n, hseInstance("hse-against-the-tide", "running"))
    expect(screen.getByTestId("hse-event-details-no-data")).toHaveTextContent(
      "Milestone data is not available yet for this event."
    )
  })

  it("shows an inline error when the catalog cannot be read", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "running"), {
      reads: { catalog: () => ({ status: "error" }) },
    })
    expect(screen.getByTestId("hse-event-details-error")).toBeInTheDocument()
  })

  it("collapses the description to its first line on mobile, with Show more", async () => {
    setViewportWidth(420)
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))

    expect(descriptionLines()).toHaveLength(1)
    await userEvent.click(screen.getByRole("button", { name: "Show more" }))
    expect(descriptionLines()).toHaveLength(3)
    expect(
      screen.getByRole("button", { name: "Show less" })
    ).toBeInTheDocument()
  })

  it("shows the whole description on desktop, without Show more", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))
    expect(descriptionLines()).toHaveLength(3)
    expect(
      screen.queryByTestId("hse-event-details-show-more")
    ).not.toBeInTheDocument()
  })
})

describe("MilestoneGrid", () => {
  const cells = () => screen.getAllByTestId("hse-milestone")

  it("shows Psyker Boost High's 20 cells: incremental points, reward and quantity, the endless step last", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))

    expect(cells()).toHaveLength(20)
    expect(
      cells()
        .slice(0, 5)
        .map(
          (cell) => within(cell).getByTestId("hse-milestone-points").textContent
        )
    ).toEqual(["20 pts", "20 pts", "20 pts", "20 pts", "25 pts"])
    expect(
      cells()
        .slice(0, 5)
        .map((cell) => cell.getAttribute("aria-label"))
    ).toEqual([
      "Uncommon ability badge ×3 at 20 points",
      "Rare ability badge ×2 at 40 points",
      "Epic ability badge ×1 at 60 points",
      "Legendary ability badge ×1 at 80 points",
      "Uncommon ability badge ×5 at 105 points",
    ])
    expect(cells()[18]).toHaveTextContent("×5")
    expect(cells()[18]).toHaveTextContent("60 pts")
    expect(cells()[18]).toHaveAttribute(
      "aria-label",
      "Mythic ability badge ×5 at 765 points"
    )
    const endless = cells()[19]!
    expect(endless).toHaveAttribute("data-endless", "true")
    expect(endless).toHaveTextContent("50 pts")
    expect(endless).toHaveAttribute(
      "aria-label",
      "Legendary ability badge ×1 every 50 points after the last milestone"
    )
    expect(cells()[0]!.querySelector("img")).toHaveAttribute(
      "src",
      "/game_catalog/resources/ui_icon_droptable_draft_abilityTokensUncommon.webp"
    )
  })

  it("shows a tooltip naming the reward and its cumulative points", async () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))
    await userEvent.hover(cells()[16]!)
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Blessed requisition order ×1 at 645 points"
    )
  })

  it("marks the repeat cap on the endless cell (Faction Boost: up to 200 times)", () => {
    renderHse(
      i18n,
      hseInstance("hse-faction-boost", "upcoming", {
        targetFactionId: "DarkAngels",
      })
    )
    expect(cells().at(-1)).toHaveTextContent("up to 200 times")
  })

  it("shows a generic icon and the id for a reward it does not know", () => {
    renderHse(i18n, hseInstance("hse-global-operation-imperator", "running"))
    const unknown = cells().find((cell) =>
      cell.getAttribute("aria-label")?.startsWith("ShardsImperial ")
    )
    expect(unknown).toBeDefined()
    expect(
      within(unknown!).getByTestId("hse-milestone-generic-icon")
    ).toBeInTheDocument()
  })

  it("uses 3 columns on mobile and 5 from 768px", () => {
    renderHse(i18n, hseInstance("hse-trait-boost-psyker", "upcoming"))
    const grid = screen.getByTestId("hse-milestones").querySelector("ol")!
    expect(grid.className).toContain("grid-cols-3")
    expect(grid.className).toContain("md:grid-cols-5")
  })
})
