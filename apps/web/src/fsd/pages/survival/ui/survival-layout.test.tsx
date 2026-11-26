import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { survivalEventsFixture } from "@workspace/game-catalog/testing"

import { render, screen, waitFor, within } from "@/test/render"

import type { SurvivalEvent } from "../model/survival-event"
import { EnemiesTab } from "./enemies-tab"
import { MissionsTab } from "./missions-tab"
import { OffersTab } from "./offers-tab"
import { RewardsTab } from "./rewards-tab"
import { SurvivalLayout } from "./survival-layout"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values && Object.keys(values).some((name) => name !== "defaultValue")
        ? `${key}:${JSON.stringify(values)}`
        : key,
    i18n: { language: "en", getResource: () => undefined },
  }),
}))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))

const captureEvent = vi.fn()
vi.mock("@/shared/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/analytics")>()),
  useAnalyticsActions: () => ({ captureEvent, isReady: true }),
}))

let events: SurvivalEvent[] | "loading" | "error" = survivalEventsFixture
vi.mock("@/shared/local-data", () => ({
  toById: <T extends { id: string }>(records: T[]) =>
    new Map(records.map((record) => [record.id, record])),
  useCatalogDataset: (
    key: string,
    select?: (records: unknown[]) => unknown
  ) => {
    if (key !== "survival-events") {
      return { status: "ready", data: select ? select([]) : [], retry: vi.fn() }
    }
    if (events === "loading") return { status: "loading", retry: vi.fn() }
    if (events === "error") return { status: "error", retry: vi.fn() }
    return {
      status: "ready",
      data: select ? select(events) : events,
      retry: vi.fn(),
    }
  },
  usePlayerChunk: () => ({ status: "ready", data: null, retry: vi.fn() }),
}))

function LocationProbe() {
  const location = useLocation()
  return (
    <span data-testid="location">
      {location.pathname}
      {location.search}
    </span>
  )
}

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<SurvivalLayout />} path="/plan/survival">
          <Route element={<EnemiesTab />} path="enemies" />
          <Route element={<RewardsTab />} path="rewards" />
          <Route element={<MissionsTab />} path="missions" />
          <Route element={<OffersTab />} path="offers" />
        </Route>
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  )
}

describe("SurvivalLayout", () => {
  beforeEach(() => {
    events = survivalEventsFixture
    captureEvent.mockClear()
    // A week before the December event starts; Crescendo A has no dates.
    vi.useFakeTimers({ toFake: ["Date"], now: Date.parse("2026-11-26T12:00Z") })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the next event's waves, the last one as the final wave", () => {
    renderPage("/plan/survival/enemies")

    expect(screen.getAllByTestId(/^survival-wave-\d+$/)).toHaveLength(20)
    expect(
      within(screen.getByTestId("survival-wave-20")).getByText("enemies.final")
    ).toBeInTheDocument()
    expect(
      within(screen.getByTestId("survival-wave-16")).getByTestId(
        "survival-clone-wave"
      )
    ).toBeInTheDocument()
    // A clone wave fights the player's own team, so it has no power of its own.
    expect(
      within(screen.getByTestId("survival-wave-16")).queryByRole("img", {
        name: /^enemies\.power/,
      })
    ).not.toBeInTheDocument()
    expect(captureEvent).toHaveBeenCalledWith({
      type: "survival_tab_viewed",
      tab: "enemies",
      eventState: "upcoming",
    })
  })

  it("drops an unknown event from the address", async () => {
    renderPage("/plan/survival/rewards?event=march-2020")

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        /^\/plan\/survival\/rewards$/
      )
    )
    expect(screen.getByTestId("survival-milestones")).toBeInTheDocument()
    expect(screen.getByTestId("survival-chests")).toBeInTheDocument()
  })

  it("keeps the picked event across tabs", async () => {
    const user = userEvent.setup()
    renderPage("/plan/survival/missions?event=december-2026")
    expect(screen.getByTestId("survival-missions")).toBeInTheDocument()

    await user.click(screen.getByTestId("survival-tab-offers"))

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/plan/survival/offers?event=december-2026"
    )
    const pass = screen.getByTestId("survival-offer-pass")
    expect(
      within(pass).getByText(/^offers\.currencyBonus:\{"pct":\d+\}$/)
    ).toBeInTheDocument()
    // The premium missions are described in the pass's note, not as a reward line.
    expect(within(pass).queryByText(/premiumMissions/)).not.toBeInTheDocument()
  })

  it("says when there are no events", () => {
    events = []
    renderPage("/plan/survival/enemies")
    expect(screen.getByTestId("survival-no-events")).toBeInTheDocument()
  })
})
