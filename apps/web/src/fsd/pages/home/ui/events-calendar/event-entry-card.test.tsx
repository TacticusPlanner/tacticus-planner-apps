import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
import type { EventEntryViewModel } from "../../model/events-calendar.types"
import { EventEntryCard } from "./event-entry-card"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
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

describe("EventEntryCard (list variant)", () => {
  it("keeps its category-color left accent when active", () => {
    render(<EventEntryCard entry={baseEntry({ isActiveNow: true })} />)
    const card = screen.getByTestId("event-entry-card")
    expect(card.className).not.toContain("border-primary")
    expect(card.className).toContain("border-l-[var(--event-battle-pass)]")
    expect(card.className).toContain("data-[active=true]:bg-primary/5")
  })

  it("keeps the same left accent color whether or not it's active", () => {
    const { unmount } = render(
      <EventEntryCard entry={baseEntry({ isActiveNow: false })} />
    )
    const inactiveClass = screen.getByTestId("event-entry-card").className
    unmount()

    render(<EventEntryCard entry={baseEntry({ isActiveNow: true })} />)
    const activeClass = screen.getByTestId("event-entry-card").className

    const accentClass = "border-l-[var(--event-battle-pass)]"
    expect(inactiveClass).toContain(accentClass)
    expect(activeClass).toContain(accentClass)
  })

  it("shows occurrence boundary tags without visible active or projected tags", () => {
    render(
      <EventEntryCard
        entry={baseEntry({ confirmed: false, isActiveNow: true })}
        isOccurrenceEnd
        isOccurrenceStart
      />
    )

    expect(
      screen.getByTestId("event-occurrence-start-badge")
    ).toHaveTextContent("events:badges.starts")
    expect(screen.getByTestId("event-occurrence-end-badge")).toHaveTextContent(
      "events:badges.ends"
    )
    expect(screen.getByTestId("event-active-badge")).toHaveClass("sr-only")
    expect(screen.getByTestId("event-confirmed-badge")).toHaveClass("sr-only")
  })

  it("renders the Wiki destination as a labeled button", () => {
    render(
      <EventEntryCard entry={baseEntry({ definitionId: "legendary-event" })} />
    )

    const wikiLink = screen.getByRole("link", { name: "events:wikiLink" })
    expect(wikiLink).toHaveTextContent("events:wikiLink")
    expect(wikiLink).toHaveAttribute("data-slot", "button")
    expect(wikiLink).toHaveAttribute("data-variant", "outline")
    expect(wikiLink).toHaveAttribute("target", "_blank")
    expect(wikiLink).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("does not render a Wiki action when the definition has no Wiki URL", () => {
    render(
      <EventEntryCard entry={baseEntry({ definitionId: "unknown-event" })} />
    )

    expect(
      screen.queryByRole("link", { name: "events:wikiLink" })
    ).not.toBeInTheDocument()
  })
})
