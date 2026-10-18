import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import type { i18n as I18n } from "i18next"

import { render, screen, within } from "@/test/render"
import { createTestI18n, i18nWrapper } from "@/test/i18n"

import enDailies from "../../../../../../public/locales/en/dailies.json"
import {
  listHomeScreenEventInstances,
  type HomeScreenEventEntry,
} from "../../model/select-active-home-screen-event"
import { EventSwitcher } from "./event-switcher"

const definitions = new Map(
  [
    "hse-against-the-tide",
    "hse-trait-boost-psyker",
    "hse-faction-focus",
    "hse-global-operation-imperator",
    "hse-faction-boost",
    "hse-machine-hunt",
  ].map((id) => [id, { type: "HomeScreenEvent" }])
)
const entry = (
  occurrenceId: string | null,
  definitionId: string,
  startUtc: string,
  endUtc: string,
  parameters: Record<string, unknown> | null = null
): HomeScreenEventEntry => ({
  occurrenceId,
  definitionId,
  startUtc,
  endUtc,
  parameters,
})
const calendar = [
  entry(
    "occ-hunt",
    "hse-machine-hunt",
    "2026-10-02T08:00:00Z",
    "2026-10-06T08:00:00Z"
  ),
  entry(
    "occ-tide",
    "hse-against-the-tide",
    "2026-10-10T08:00:00Z",
    "2026-10-17T08:00:00Z"
  ),
  entry(
    "occ-psyker",
    "hse-trait-boost-psyker",
    "2026-10-19T08:00:00Z",
    "2026-10-23T08:00:00Z"
  ),
  entry(
    "occ-imperator",
    "hse-global-operation-imperator",
    "2026-10-26T08:00:00Z",
    "2026-11-01T08:00:00Z"
  ),
  entry(
    "occ-focus",
    "hse-faction-focus",
    "2026-10-26T08:00:00Z",
    "2026-11-01T08:00:00Z"
  ),
  entry(
    null,
    "hse-faction-boost",
    "2026-11-02T00:00:00Z",
    "2026-11-06T00:00:00Z",
    { targetFactionId: "DarkAngels" }
  ),
]
const instancesAt = (now: string) =>
  listHomeScreenEventInstances(calendar, definitions, Date.parse(now))

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", { en: { dailies: enDailies } })
})

function renderSwitcher(
  selectedKey: string | null,
  now = "2026-10-17T12:48:00Z",
  onSelect = vi.fn()
) {
  render(
    <EventSwitcher
      instances={instancesAt(now)}
      onSelect={onSelect}
      selectedKey={selectedKey}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
  return onSelect
}

describe("EventSwitcher", () => {
  it("shows the selected instance's localized name and date range", () => {
    renderSwitcher("occ-psyker")

    expect(screen.getByTestId("hse-event-select")).toHaveTextContent(
      "Trait Boost: Psyker · Oct 19 – 23, 2026"
    )
    expect(screen.getByTestId("hse-event-select")).toHaveAccessibleName(
      "Choose a Home Screen Event"
    )
  })

  it("groups Running, Upcoming (by start) and Past (newest first), with the Faction Boost target", async () => {
    const user = userEvent.setup()
    renderSwitcher("occ-focus", "2026-10-27T00:00:00Z")

    await user.click(screen.getByTestId("hse-event-select"))

    const keys = (group: string) =>
      within(screen.getByTestId(`hse-event-group-${group}`))
        .getAllByRole("option")
        .map((option) => option.getAttribute("data-testid"))
    expect(keys("running")).toEqual([
      "hse-event-option-occ-focus",
      "hse-event-option-occ-imperator",
    ])
    expect(keys("upcoming")).toEqual([
      "hse-event-option-hse-faction-boost@2026-11-02T00:00:00Z",
    ])
    expect(keys("past")).toEqual([
      "hse-event-option-occ-psyker",
      "hse-event-option-occ-tide",
      "hse-event-option-occ-hunt",
    ])
    expect(
      screen.getByRole("option", { name: /Faction Boost: Dark Angels/ })
    ).toBeInTheDocument()
    expect(screen.getByText("Running")).toBeInTheDocument()
    expect(screen.getByText("Past")).toBeInTheDocument()
  })

  it("selects an instance from the list", async () => {
    const user = userEvent.setup()
    const onSelect = renderSwitcher("occ-psyker")

    await user.click(screen.getByTestId("hse-event-select"))
    await user.click(screen.getByRole("option", { name: /Against the Tide/ }))

    expect(onSelect).toHaveBeenCalledWith("occ-tide")
  })

  it("steps by start with Previous / Next, a same start ordered by definition id", async () => {
    const user = userEvent.setup()
    const onSelect = renderSwitcher("occ-focus")

    await user.click(screen.getByRole("button", { name: "Next event" }))
    expect(onSelect).toHaveBeenLastCalledWith("occ-imperator")
    await user.click(screen.getByRole("button", { name: "Previous event" }))
    expect(onSelect).toHaveBeenLastCalledWith("occ-psyker")
  })

  it("disables Previous at the first and Next at the last instance", () => {
    renderSwitcher("occ-hunt")
    expect(screen.getByTestId("hse-event-previous")).toBeDisabled()
    expect(screen.getByTestId("hse-event-next")).toBeEnabled()
  })

  it("disables Next at the last instance", () => {
    renderSwitcher("hse-faction-boost@2026-11-02T00:00:00Z")
    expect(screen.getByTestId("hse-event-previous")).toBeEnabled()
    expect(screen.getByTestId("hse-event-next")).toBeDisabled()
  })

  it("has no options and disabled controls with an empty calendar", () => {
    render(
      <EventSwitcher instances={[]} onSelect={vi.fn()} selectedKey={null} />,
      {
        wrapper: i18nWrapper(i18n),
      }
    )
    expect(screen.getByTestId("hse-event-select")).toBeDisabled()
    expect(screen.getByTestId("hse-event-select")).toHaveTextContent(
      "No events in the calendar"
    )
    expect(screen.getByTestId("hse-event-previous")).toBeDisabled()
    expect(screen.getByTestId("hse-event-next")).toBeDisabled()
  })

  it("is a full-width row on mobile and inline from 768px, with the arrows at its ends", () => {
    renderSwitcher("occ-psyker")
    const switcher = screen.getByTestId("hse-event-switcher")

    // Below 768px: the row spans the width and the select grows between the arrows.
    expect(switcher.className).toContain("w-full")
    expect(screen.getByTestId("hse-event-select").className).toContain("flex-1")
    // From 768px: inline on the title row with a fixed-width select.
    expect(switcher.className).toContain("md:w-auto")
    expect(screen.getByTestId("hse-event-select").className).toContain(
      "md:flex-none"
    )
    const children = [...switcher.children]
    expect(children[0]).toBe(screen.getByTestId("hse-event-previous"))
    expect(children.at(-1)).toBe(screen.getByTestId("hse-event-next"))
  })
})
