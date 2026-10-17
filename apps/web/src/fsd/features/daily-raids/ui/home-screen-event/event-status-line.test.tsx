import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import type { i18n as I18n } from "i18next"

import { render, screen } from "@/test/render"
import { createTestI18n, i18nWrapper } from "@/test/i18n"

import enDailies from "../../../../../../public/locales/en/dailies.json"
import {
  listHomeScreenEventInstances,
  selectActiveHomeScreenEvent,
  type HomeScreenEventEntry,
} from "../../model/select-active-home-screen-event"
import type { ActiveHomeScreenEventState } from "../../model/use-active-home-screen-event"
import { EventPreviewBanner } from "./event-preview-banner"
import { EventStatusLine } from "./event-status-line"

const definitions = new Map(
  ["hse-machine-hunt", "hse-warp-surge", "hse-faction-boost"].map((id) => [
    id,
    { type: "HomeScreenEvent" },
  ])
)
const entry = (
  definitionId: string,
  startUtc: string,
  endUtc: string
): HomeScreenEventEntry => ({
  occurrenceId: `occ-${definitionId}-${startUtc.slice(0, 10)}`,
  definitionId,
  startUtc,
  endUtc,
})
const hunt = entry(
  "hse-machine-hunt",
  "2026-10-02T08:00:00Z",
  "2026-10-06T08:00:00Z"
)
const boost = entry(
  "hse-faction-boost",
  "2026-10-08T08:00:00Z",
  "2026-10-11T08:00:00Z"
)
const warp = entry(
  "hse-warp-surge",
  "2026-11-05T08:00:00Z",
  "2026-11-08T08:00:00Z"
)

function stateAt(now: string, entries = [hunt, boost, warp]) {
  const nowMs = Date.parse(now)
  const instances = listHomeScreenEventInstances(entries, definitions, nowMs)
  return {
    status: "ready",
    ...selectActiveHomeScreenEvent(entries, definitions, nowMs),
    instances,
    nowMs,
  } as unknown as Extract<ActiveHomeScreenEventState, { status: "ready" }>
}
const instanceOf = (
  state: ReturnType<typeof stateAt>,
  value: HomeScreenEventEntry
) => state.instances.find((instance) => instance.entry === value) ?? null

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", { en: { dailies: enDailies } })
})
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
})
afterEach(() => vi.useRealTimers())

function renderLine(
  state: ActiveHomeScreenEventState,
  instance: ReturnType<typeof instanceOf>
) {
  render(<EventStatusLine instance={instance} state={state} />, {
    wrapper: i18nWrapper(i18n),
  })
}

describe("EventStatusLine", () => {
  it("shows a past instance's name and Ended on date, nothing about points", () => {
    vi.setSystemTime(new Date("2026-10-07T00:00:00Z"))
    const state = stateAt("2026-10-07T00:00:00Z")
    renderLine(state, instanceOf(state, hunt))

    const line = screen.getByTestId("hse-status-past")
    expect(line).toHaveTextContent("Machine Hunt")
    expect(line).toHaveTextContent("Ended on")
    expect(line).toHaveTextContent("Oct 6, 2026")
    expect(line).not.toHaveTextContent("event points")
  })

  it("announces the default upcoming instance as next when none runs", () => {
    vi.setSystemTime(new Date("2026-10-07T00:00:00Z"))
    const state = stateAt("2026-10-07T00:00:00Z")
    renderLine(state, instanceOf(state, boost))

    const line = screen.getByTestId("hse-status-upcoming")
    expect(line).toHaveTextContent("No Home Screen Event is running right now.")
    expect(line).toHaveTextContent("Next event: Faction Boost")
    expect(line).toHaveTextContent("Starts")
  })

  it("shows a later upcoming instance by name and countdown while another runs", () => {
    vi.setSystemTime(new Date("2026-10-09T00:00:00Z"))
    const laterWarp = entry(
      "hse-warp-surge",
      "2026-11-20T08:00:00Z",
      "2026-11-23T08:00:00Z"
    )
    const state = stateAt("2026-10-09T00:00:00Z", [
      hunt,
      boost,
      warp,
      laterWarp,
    ])
    renderLine(state, instanceOf(state, laterWarp))

    const line = screen.getByTestId("hse-status-upcoming")
    expect(line).not.toHaveTextContent("No Home Screen Event is running")
    expect(line).not.toHaveTextContent("Next event")
    expect(line).toHaveTextContent("Warp Surge")
    expect(line).toHaveTextContent("Nov 20, 2026")
  })

  it("shows a running instance with its remaining time", () => {
    vi.setSystemTime(new Date("2026-10-09T00:00:00Z"))
    const state = stateAt("2026-10-09T00:00:00Z")
    renderLine(state, instanceOf(state, boost))

    const line = screen.getByTestId("hse-status-active")
    expect(line).toHaveTextContent("Faction Boost")
    expect(line).toHaveTextContent(
      "This event does not earn points from campaign raiding."
    )
  })

  it("says nothing is scheduled with no shown instance", () => {
    const state = stateAt("2026-12-01T00:00:00Z")
    renderLine(state, null)

    expect(screen.getByTestId("hse-status-none")).toHaveTextContent(
      "No Home Screen Event is scheduled."
    )
  })
})

describe("EventPreviewBanner", () => {
  it("labels any selected upcoming instance as a not-live preview", () => {
    vi.setSystemTime(new Date("2026-10-03T00:00:00Z"))
    render(<EventPreviewBanner entry={warp} />, {
      wrapper: i18nWrapper(i18n),
    })

    const banner = screen.getByTestId("hse-preview-banner")
    expect(banner).toHaveTextContent("Preview: Warp Surge is not live yet")
    expect(banner).toHaveTextContent("Nov 5, 2026")
  })
})
