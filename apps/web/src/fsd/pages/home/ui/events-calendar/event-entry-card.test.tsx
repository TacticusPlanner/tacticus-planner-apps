import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { render, screen } from "@/test/render"

import type { EventEntryViewModel } from "../../model/events-calendar.types"
import { EventAgendaRow, EventBar } from "./event-entry-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
    i18n: { resolvedLanguage: "en", language: "en" },
  }),
}))

function baseEntry(
  overrides: Partial<EventEntryViewModel>
): EventEntryViewModel {
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
    derivedSeasonNumber: undefined,
    derivedEventNumber: undefined,
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
