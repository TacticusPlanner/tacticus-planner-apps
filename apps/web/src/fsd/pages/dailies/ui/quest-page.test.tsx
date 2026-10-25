import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { MemoryRouter } from "react-router"
import {
  questCratesFixture,
  questEventsFixture,
} from "@workspace/game-catalog/testing"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { CreateGoalLauncherProvider } from "@/features/goal-create"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, waitFor, within } from "@/test/render"
import {
  resetTestDatabases,
  seedGameCatalog,
  seedPlayerData,
} from "@/test/seed"
import enDailies from "../../../../../public/locales/en/dailies.json"
import enQuest from "../../../../../public/locales/en/quest.json"

import { QuestPage } from "./quest-page"

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isMobile: false,
    launch: vi.fn(),
    instance: { status: "loading" } as unknown,
    tourSteps: undefined as unknown,
  },
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mocks.isMobile,
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    mocks.tourSteps = steps
  },
}))
vi.mock("@/features/quest-event/model/use-quest-instance", () => ({
  useQuestInstance: () => mocks.instance,
  useIsQuestLive: () => false,
}))
vi.mock("@/features/daily-raids/model/use-daily-raids", () => ({
  useDailyRaids: () => ({ status: "no-goals" }),
}))

const nubariEntry = {
  occurrenceId: "occ-2026-10-21-quest-nubari-vs-black-legion",
  definitionId: "quest",
  startUtc: "2026-10-21T00:00:00Z",
  endUtc: "2026-10-24T00:00:00Z",
  parameters: {
    featuredCharacterId: "astarEradicator",
    enemyFactionId: "BlackLegion",
  },
}
const instance = (
  phase: "running" | "claim" | "preview",
  nowIso: string,
  entry = nubariEntry
) => ({
  status: "ready",
  nowMs: Date.parse(nowIso),
  instance: {
    key: entry.occurrenceId,
    entry,
    phase,
    featuredCharacterId: entry.parameters.featuredCharacterId,
    claimEndMs: Date.parse(entry.endUtc) + 24 * 3_600_000,
  },
})

let i18n: I18n

function renderPage() {
  return render(
    <CreateGoalLauncherProvider onLaunch={mocks.launch}>
      <MemoryRouter>
        <QuestPage />
      </MemoryRouter>
    </CreateGoalLauncherProvider>,
    { wrapper: i18nWrapper(i18n) }
  )
}

const row = (number: number) =>
  screen
    .getAllByTestId("quest-battle-row")
    .find((element) => element.dataset.battle === String(number))!

describe("QuestPage", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en", {
      en: { quest: enQuest, dailies: enDailies },
    })
  })
  beforeEach(async () => {
    window.localStorage.clear()
    mocks.isMobile = false
    mocks.instance = instance("running", "2026-10-23T18:00:00Z")
    await resetTestDatabases()
    await seedGameCatalog({
      "quest-events": questEventsFixture,
      "quest-crates": questCratesFixture,
      characters: [
        { id: "astarEradicator", name: "Nubari" },
        { id: "astarCyrus", name: "Cyrus" },
        { id: "votanChampion", name: "Kîmm" },
      ],
    })
    await seedPlayerData({
      characters: [],
      "inventory-shards": [
        { unitId: "astarEradicator", amount: 12, mythicAmount: 0 },
      ],
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows Nubari not owned with the factions, tiers and battle maxima", async () => {
    renderPage()
    await waitFor(() =>
      expect(screen.getByTestId("quest-header-hero")).toHaveTextContent(
        "Nubari"
      )
    )
    await waitFor(() =>
      expect(screen.getByTestId("quest-header-ownership")).toHaveTextContent(
        "Not owned · 12 shards"
      )
    )
    expect(screen.getByTestId("quest-header-countdown")).toHaveTextContent(
      /ends in 6/
    )
    expect(screen.getByTestId("quest-header-enemies")).toHaveTextContent(
      "Black Legion"
    )
    expect(screen.getByTestId("quest-header-allowed")).toHaveTextContent(
      /Ultramarines.*Blood Angels/
    )
    const common = await screen.findAllByTestId("quest-tier")
    expect(common[0]).toHaveAttribute("data-tier", "Common")
    expect(
      within(common[0]!).getByTestId("quest-tier-points")
    ).toHaveTextContent("0 / 1,600")
    expect(within(row(1)).getByTestId("quest-battle-points")).toHaveTextContent(
      "0 / 600"
    )
    expect(within(row(1)).getByTestId("quest-battle-slots")).toHaveTextContent(
      "3 units"
    )
    expect(within(row(1)).getAllByTestId("quest-objective-chip")).toHaveLength(
      2
    )
  })

  it("scores battle 1 at 500, keeps it on reload, and counts nothing with 0 medals", async () => {
    const user = userEvent.setup()
    const { unmount } = renderPage()
    await screen.findAllByTestId("quest-battle-row")
    await user.click(screen.getByRole("radio", { name: "3 medals" }))
    await user.click(screen.getByRole("button", { name: "Full HP" }))
    await user.click(screen.getByRole("checkbox", { name: /No summons/ }))
    expect(within(row(1)).getByTestId("quest-battle-points")).toHaveTextContent(
      "500 / 600"
    )
    expect(screen.getByTestId("quest-summary-total")).toHaveTextContent(
      "500 / 8,800"
    )
    unmount()

    renderPage()
    await waitFor(() =>
      expect(
        within(row(1)).getByTestId("quest-battle-points")
      ).toHaveTextContent("500 / 600")
    )
    await user.click(screen.getByRole("radio", { name: "0 medals" }))
    expect(within(row(1)).getByTestId("quest-battle-points")).toHaveTextContent(
      "0 / 600"
    )
    expect(screen.getByRole("button", { name: "Full HP" })).toBeDisabled()
  })

  it("tracks the next crate, the hero's shards with the bundle, and the attempts left", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByTestId("quest-battle-row")
    expect(await screen.findByTestId("quest-crate-to-go")).toHaveTextContent(
      "1,000 points to go"
    )
    expect(screen.getByTestId("quest-tokens-plan")).toHaveTextContent(
      "9 attempts for 17 battles to improve (if your bank is full now) · 8 attempts short"
    )

    await user.click(screen.getByRole("radio", { name: "3 medals" }))
    await user.click(screen.getByRole("button", { name: "Full HP" }))
    expect(screen.getByTestId("quest-crate-to-go")).toHaveTextContent(
      "600 points to go"
    )
    expect(screen.getByTestId("quest-shards-line")).toHaveTextContent(
      "3 earned · 51 max · 48 still reachable"
    )
    await user.click(screen.getByRole("switch", { name: /Quest Bundle/ }))
    expect(screen.getByTestId("quest-shards-line")).toHaveTextContent(
      "9 earned · 153 max · 144 still reachable"
    )
  })

  it("previews the attempts of a quest that has not started", async () => {
    mocks.instance = instance("preview", "2026-10-20T12:00:00Z")
    renderPage()
    expect(await screen.findByTestId("quest-tokens-preview")).toHaveTextContent(
      "about 42 attempts"
    )
    expect(screen.getByRole("switch", { name: /Quest Bundle/ })).toBeDisabled()
  })

  it("closes the battles in the claim window but keeps the rewards", async () => {
    mocks.instance = instance("claim", "2026-10-24T06:00:00Z")
    renderPage()
    expect(await screen.findByTestId("quest-tokens")).toHaveTextContent(
      "Battles are closed"
    )
    expect(screen.getByTestId("quest-crate-track")).toBeVisible()
  })

  it("shows battle 4's lineup rules, enemies and objectives", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByTestId("quest-battle-row")
    await user.click(row(4))
    const detail = screen.getByTestId("quest-battle-detail")
    expect(detail).toHaveAttribute("data-battle", "4")
    expect(within(detail).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Battle 4 · Uncommon"
    )
    expect(
      within(detail).getByTestId("quest-battle-slots-line")
    ).toHaveTextContent("3 units, Nubari included")
    expect(within(detail).getByTestId("quest-battle-cap")).toHaveTextContent(
      "ability level 17"
    )
    expect(
      within(detail).getByText("Lightning Victory in 2 turns")
    ).toBeVisible()
    expect(within(detail).getByTestId("quest-battle-power")).toHaveTextContent(
      "Enemy power 1,183"
    )
    expect(within(detail).getByTestId("quest-battle-max")).toHaveTextContent(
      "Up to 600 points"
    )
    expect(
      within(detail).getByTestId("quest-battle-enemy-count")
    ).toHaveTextContent("6 enemies")
    const chips = within(detail).getAllByTestId("quest-objective-chip")
    expect(chips.map((chip) => chip.textContent)).toEqual([
      "Lineup restriction: No Rapid Assault units · 100",
      "Lineup restriction: No Blast damage · 100",
    ])
  })

  it("lists Nubari battle 9's power-up apart from the enemies", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByTestId("quest-battle-row")
    await user.click(row(9))
    expect(screen.getByTestId("quest-battle-pickups")).toBeInTheDocument()
  })

  it("shows the Mythic drop's odds and that no goal needs it", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByTestId("quest-battle-row")
    await user.click(row(17))
    expect(screen.getByTestId("quest-battle-odds")).toHaveTextContent(
      "1 in 6 (17%)"
    )
    expect(screen.getByTestId("quest-drop-need")).toHaveTextContent(
      "No goal needs this"
    )
  })

  it("warns in the claim window and keeps scores editable", async () => {
    mocks.instance = instance("claim", "2026-10-24T10:00:00Z")
    renderPage()
    expect(await screen.findByTestId("quest-header-claim")).toHaveTextContent(
      /Battles are closed\. Claim your rewards: 14 \S+ left/
    )
    expect(await screen.findByRole("radio", { name: "3 medals" })).toBeEnabled()
  })

  it("previews Kîmm read-only", async () => {
    mocks.instance = instance("preview", "2026-10-25T00:00:00Z", {
      occurrenceId: "occ-2026-11-11-quest-kimm-vs-orks",
      definitionId: "quest",
      startUtc: "2026-11-11T00:00:00Z",
      endUtc: "2026-11-14T00:00:00Z",
      parameters: {
        featuredCharacterId: "votanChampion",
        enemyFactionId: "Orks",
      },
    })
    renderPage()
    expect(await screen.findByTestId("quest-header-preview")).toBeVisible()
    expect(screen.getByTestId("quest-header-countdown")).toHaveTextContent(
      /starts in 17 /
    )
    expect(
      await screen.findByRole("radio", { name: "3 medals" })
    ).toBeDisabled()
  })

  it("says an older quest has no battle data", async () => {
    mocks.instance = instance("running", "2026-08-10T00:00:00Z", {
      occurrenceId: "occ-sekhetar",
      definitionId: "quest",
      startUtc: "2026-08-09T00:00:00Z",
      endUtc: "2026-08-12T00:00:00Z",
      parameters: {
        featuredCharacterId: "thousSekhetar",
        enemyFactionId: "Orks",
      },
    })
    renderPage()
    expect(await screen.findByTestId("quest-header-hero")).toHaveTextContent(
      "thousSekhetar"
    )
    expect(
      await screen.findByText("No battle data for this quest yet")
    ).toBeVisible()
  })

  it("browses Cyrus without inputs or summary, and returns to Nubari", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByTestId("quest-battle-row")
    await user.click(screen.getByRole("combobox", { name: "Quest" }))
    await user.click(await screen.findByRole("option", { name: "Cyrus" }))
    await waitFor(() =>
      expect(screen.getByTestId("quest-header-hero")).toHaveTextContent("Cyrus")
    )
    expect(screen.getAllByTestId("quest-battle-row")).toHaveLength(17)
    expect(screen.queryByTestId("quest-score-entry")).toBeNull()
    expect(screen.queryByTestId("quest-summary")).toBeNull()
    await user.click(
      screen.getByRole("button", { name: "Back to the current quest" })
    )
    expect(screen.getByTestId("quest-header-hero")).toHaveTextContent("Nubari")
    expect(screen.getByTestId("quest-summary")).toBeInTheDocument()
  })

  it("opens a bottom sheet with the inputs on mobile", async () => {
    mocks.isMobile = true
    const user = userEvent.setup()
    renderPage()
    const toggles = await screen.findAllByTestId("quest-tier-toggle")
    expect(toggles[0]).toHaveAttribute("aria-expanded", "true")
    await user.click(toggles[1]!)
    await user.click(row(4))
    const sheet = await screen.findByTestId("quest-battle-sheet")
    expect(within(sheet).getByTestId("quest-score-entry")).toBeInTheDocument()
    expect(within(sheet).getByTestId("quest-battle-detail")).toHaveAttribute(
      "data-battle",
      "4"
    )
  })

  it("gives the tour targets that render on desktop and mobile", async () => {
    renderPage()
    await screen.findAllByTestId("quest-battle-row")
    const steps = mocks.tourSteps as {
      desktop: { target: string }[]
      mobile: { target: string }[]
    }
    for (const step of steps.desktop) {
      expect(document.querySelector(step.target), step.target).not.toBeNull()
    }
  })
})
