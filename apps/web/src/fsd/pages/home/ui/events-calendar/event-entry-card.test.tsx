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
})
