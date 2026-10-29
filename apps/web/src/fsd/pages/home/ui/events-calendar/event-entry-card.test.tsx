import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { PositionedEventEntry } from "../../model/events-calendar.types"
import { EventAgendaRow, EventBar } from "./event-entry-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
    i18n: { resolvedLanguage: "en", language: "en" },
  }),
}))

function baseEntry(
  overrides: Partial<PositionedEventEntry>
): PositionedEventEntry {
  return {
    key: "test",
    definitionId: "battle-pass",
    definitionType: "BattlePass",
    occurrenceId: "occ-1",
    confirmed: true,
    startUtc: "2026-08-09T00:00:00Z",
    endUtc: "2026-08-16T00:00:00Z",
    parameters: null,
    isActiveNow: false,
    isPast: false,
    phases: [],
    derivedSeasonNumber: undefined,
    derivedEventNumber: undefined,
    startColumn: 1,
    span: 7,
    barStartMs: Date.parse("2026-08-09T00:00:00Z"),
    barEndMs: Date.parse("2026-08-16T00:00:00Z"),
    startOffset: 0,
    endOffset: 7,
    ...overrides,
  }
}

describe("EventBar", () => {
  it("shows the game icon and the family stripe, not a solid category color", () => {
    render(<EventBar entry={baseEntry({})} />)

    const bar = screen.getByTestId("event-entry-card")
    expect(bar.className).toContain("border-l-[var(--event-family-passes)]")
    expect(bar.querySelector("img")).toHaveAttribute(
      "src",
      "/game_catalog/datamines/atlases/ui_icon_menu_battlepass.webp"
    )
    expect(bar).toHaveTextContent("battle-pass")
    // Anchors the sr-only state text, which otherwise escapes the mobile Ongoing scroller and
    // widens the page.
    expect(bar).toHaveClass("relative")
  })

  it("keeps a one-day bar's name for assistive tech only", () => {
    render(
      <EventBar
        entry={baseEntry({
          definitionId: "always-double-xp-sunday",
          definitionType: "StandingModifier",
        })}
        iconOnly
      />
    )

    const name = screen.getByText("always-double-xp-sunday")
    expect(name).toHaveClass("sr-only")
  })

  it("marks projected entries with a dashed border and keeps state text screen-reader only", () => {
    render(
      <EventBar entry={baseEntry({ confirmed: false, isActiveNow: true })} />
    )

    expect(screen.getByTestId("event-entry-card").className).toContain(
      "border-dashed"
    )
    expect(screen.getByTestId("event-active-badge")).toHaveClass("sr-only")
    expect(screen.getByTestId("event-confirmed-badge")).toHaveClass("sr-only")
  })

  it("opens details with the Wiki link instead of rendering it inside the bar", async () => {
    const user = userEvent.setup()
    render(<EventBar entry={baseEntry({ definitionId: "legendary-event" })} />)

    expect(
      screen.queryByRole("link", { name: "wikiLink" })
    ).not.toBeInTheDocument()

    await user.click(screen.getByTestId("event-entry-card"))

    const wikiLink = await screen.findByRole("link", {
      name: "wikiLink",
    })
    expect(wikiLink).toHaveAttribute("target", "_blank")
    expect(wikiLink).toHaveAttribute("rel", "noopener noreferrer")
    expect(screen.getByTestId("event-details")).toHaveTextContent(
      "legendary-event"
    )
  })

  it("has no Wiki action in details when the definition has no Wiki URL", async () => {
    const user = userEvent.setup()
    render(<EventBar entry={baseEntry({ definitionId: "unknown-event" })} />)

    await user.click(screen.getByTestId("event-entry-card"))

    await screen.findByTestId("event-details")
    expect(
      screen.queryByRole("link", { name: "wikiLink" })
    ).not.toBeInTheDocument()
  })
})

describe("EventBar guild seasons", () => {
  const warSeason = baseEntry({
    definitionId: "guild-war-season",
    definitionType: "GuildWarSeason",
    startUtc: "2026-10-23T09:00:00Z",
    endUtc: "2026-10-26T09:00:00Z",
    barStartMs: Date.parse("2026-10-23T00:00:00Z"),
    barEndMs: Date.parse("2026-10-27T00:00:00Z"),
    phases: [
      {
        kind: "preparation",
        war: 1,
        startUtc: "2026-10-23T09:00:00Z",
        endUtc: "2026-10-24T09:00:00Z",
      },
      {
        kind: "war",
        war: 1,
        startUtc: "2026-10-24T09:00:00Z",
        endUtc: "2026-10-25T21:00:00Z",
      },
    ],
  })

  it("draws each war window over the bar and lists the phases in details", async () => {
    const user = userEvent.setup()
    render(<EventBar entry={warSeason} />)

    const war = screen.getByTestId("event-war-phase")
    // 33h after the bar's start, over a 96h bar.
    expect(war.style.left).toBe("34.375%")
    expect(war.style.width).toBe("37.5%")

    await user.click(screen.getByTestId("event-entry-card"))
    const phases = await screen.findByTestId("event-phases")
    expect(phases).toHaveTextContent("details.phases.row")
    expect(phases).toHaveTextContent("details.phases.preparation")
    expect(phases).toHaveTextContent("details.phases.war")
  })

  it("labels a Guild Raid break even as a one-day bar", () => {
    render(
      <EventBar
        entry={baseEntry({
          definitionId: "guild-raid-break",
          definitionType: "GuildRaidBreak",
        })}
        iconOnly
      />
    )

    const bar = screen.getByTestId("event-entry-card")
    expect(bar).toHaveTextContent("badges.break")
    expect(screen.getByText("guild-raid-break")).toHaveClass("sr-only")
  })

  it("grays out an entry that has ended", () => {
    render(<EventBar entry={baseEntry({ isPast: true })} />)

    expect(screen.getByTestId("event-entry-card")).toHaveClass("grayscale")
  })
})

describe("EventAgendaRow", () => {
  it("shows the occurrence boundary tags it is given", () => {
    render(
      <EventAgendaRow entry={baseEntry({})} isOccurrenceEnd isOccurrenceStart />
    )

    expect(
      screen.getByTestId("event-occurrence-start-badge")
    ).toHaveTextContent("badges.starts")
    expect(screen.getByTestId("event-occurrence-end-badge")).toHaveTextContent(
      "badges.ends"
    )
  })
})
