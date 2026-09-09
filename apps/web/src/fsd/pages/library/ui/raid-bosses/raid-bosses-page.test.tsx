import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

const { useIsMobileMock } = vi.hoisted(() => ({
  useIsMobileMock: vi.fn(() => false),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: useIsMobileMock,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

// Minimal stand-in for dexie-react-hooks' useLiveQuery — runs the querier, resolves its promise, and
// re-renders, honoring the `defaultResult` sentinel while pending.
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const { getRaidBossesMock } = vi.hoisted(() => ({
  getRaidBossesMock: vi.fn(),
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getRaidBosses: getRaidBossesMock,
  getCharactersMap: () => Promise.resolve(new Map()),
  getNpcs: () => Promise.resolve([]),
}))

// Resolve i18n keys to the key itself (plus interpolated values) so assertions can match on keys.
const abilityTextFixture: Record<string, unknown> = {
  AbilityX: {
    description: "Deals {[dmg]} damage",
    variables: { dmg: [10, 20, 30] },
    constants: {},
    scaled: [],
  },
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && Object.keys(opts).filter((k) => k !== "defaultValue").length
        ? `${key} ${JSON.stringify(opts)}`
        : ((opts?.defaultValue as string) ?? key),
    i18n: {
      exists: () => true,
      language: "en",
      getResource: (_lng: string, ns: string, key: string) =>
        ns === "raidBossAbilityText" ? abilityTextFixture[key] : undefined,
    },
  }),
}))

const step = (progressionIndex: number) => ({
  health: 1000 * (progressionIndex + 1),
  damage: 10,
  fixedArmor: 5,
  rank: progressionIndex,
  starLevel: 1,
  baseRarity: "Common",
  progressionIndex,
  abilityLevel: progressionIndex + 1,
})

const unit = (
  unitSetId: string,
  kind: "boss" | "prime",
  extra: Record<string, unknown> = {}
) => ({
  unitSetId,
  kind,
  isPrimarch: false,
  factionId: "Tyranids",
  movement: 4,
  statProgression: [step(0), step(1), step(2)],
  ...extra,
})

const payload = {
  id: "raid-bosses",
  seasonConfigRotation: ["s1", "s2"],
  bosses: [
    unit("GuildBoss1Boss1Tervigon", "boss", {
      weapons: [
        { hits: 3, damageProfile: "melee" },
        { hits: 1, damageProfile: "ranged", range: 4 },
      ],
      activeAbilityIds: ["AbilityX"],
      traitIds: ["Flying"],
    }),
    unit("GuildBoss4Boss1Ghazghkull", "boss"),
  ],
  primes: [unit("GuildBoss1MiniBoss1Warrior", "prime", { isPrimarch: true })],
  seasons: {
    s1: {
      seasonConfigId: "s1",
      tiers: [
        {
          tier: 6,
          sets: [
            {
              set: 0,
              chestId: "chest-0",
              guildXp: 100,
              encounters: [
                {
                  encounterIndex: 0,
                  encounterType: "Boss",
                  boardId: "GB_01",
                  maxNrOfTurns: 6,
                  unitSetId: "GuildBoss1Boss1Tervigon",
                  progressionIndex: 2,
                  fieldNpcIds: ["GuildBoss1Npc1Termagant"],
                  disallowedFactionIds: ["Tyranids"],
                  modifiers: [],
                },
                {
                  encounterIndex: 1,
                  encounterType: "Crystal",
                  boardId: "GB_02",
                  maxNrOfTurns: 6,
                  unitSetId: "GuildBoss1MiniBoss1Warrior",
                  progressionIndex: 3,
                  fieldNpcIds: [],
                  disallowedFactionIds: [],
                  modifiers: [
                    {
                      hpLost: 180,
                      modifierId: "mod-a",
                      type: "bossStatPctDecrease",
                      target: "dmg",
                      amount: 20,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    s2: {
      seasonConfigId: "s2",
      tiers: [
        {
          tier: 5,
          sets: [
            {
              set: 1,
              chestId: "chest-1",
              guildXp: 200,
              encounters: [
                {
                  encounterIndex: 0,
                  encounterType: "Boss",
                  boardId: "GB_03",
                  maxNrOfTurns: 6,
                  unitSetId: "GuildBoss1Boss1Tervigon",
                  progressionIndex: 3,
                  fieldNpcIds: [],
                  disallowedFactionIds: [],
                  modifiers: [],
                },
                {
                  encounterIndex: 1,
                  encounterType: "Crystal",
                  boardId: "GB_04",
                  maxNrOfTurns: 6,
                  unitSetId: "GuildBoss1MiniBoss1Warrior",
                  progressionIndex: 3,
                  fieldNpcIds: [],
                  disallowedFactionIds: [],
                  modifiers: [
                    {
                      hpLost: 180,
                      modifierId: "mod-a",
                      type: "bossStatPctDecrease",
                      target: "dmg",
                      amount: 20,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

function Location() {
  const location = useLocation()
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  )
}

function renderPage(entry = "/library/raid-bosses") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/library/raid-bosses/:entityId?"
          element={
            <>
              <RaidBossesPage />
              <Location />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

// Imported after the mocks above are registered.
const { RaidBossesPage } = await import("./raid-bosses-page")

describe("RaidBossesPage", () => {
  beforeEach(() => {
    getRaidBossesMock.mockReset()
    useIsMobileMock.mockReturnValue(false)
  })

  it("shows the feature-unavailable state when the dataset has not synced", async () => {
    getRaidBossesMock.mockResolvedValue(null)
    renderPage()

    await waitFor(() =>
      expect(screen.getByTestId("raid-bosses-library-page")).toHaveTextContent(
        "collections.raidBossesNoRecords"
      )
    )
  })

  it("shows a retry-able failure state when the dataset read throws, and recovers on retry", async () => {
    const user = userEvent.setup()
    getRaidBossesMock.mockRejectedValueOnce(new Error("boom"))
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage()

    const failure = await screen.findByTestId("raid-bosses-sync-failed")
    expect(failure).toHaveTextContent("raidBosses.syncFailed")

    await user.click(screen.getByRole("button", { name: "raidBosses.retry" }))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("renders the season reference and opens a contextual encounter detail", async () => {
    const user = userEvent.setup()
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage()

    await screen.findByTestId("raid-boss-season-reference")
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/library/raid-bosses"
    )
    expect(screen.getByTestId("raid-boss-season-tier-6")).toBeInTheDocument()
    expect(screen.getByTestId("raid-boss-season-set-0")).toHaveTextContent(
      "GuildBoss1MiniBoss1Warrior"
    )

    await user.click(
      screen.getByRole("button", { name: "GuildBoss1Boss1Tervigon" })
    )

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1Boss1Tervigon?season=s1&tier=6&set=0&encounter=0"
      )
    )
    expect(screen.getByTestId("raid-boss-detail")).toBeInTheDocument()
    expect(screen.getByTestId("raid-boss-abilities")).toHaveTextContent(
      "Deals 20 damage"
    )
  })

  it("returns a contextual detail to its selected season reference", async () => {
    const user = userEvent.setup()
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage(
      "/library/raid-bosses/GuildBoss1Boss1Tervigon?season=s2&tier=5&set=1&encounter=0"
    )

    await screen.findByTestId("raid-boss-detail")
    await user.click(screen.getByTestId("raid-boss-view-season-reference"))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?season=s2"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("returns a direct mobile detail to the default season reference", async () => {
    const user = userEvent.setup()
    useIsMobileMock.mockReturnValue(true)
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    await screen.findByTestId("raid-boss-detail")
    await user.click(screen.getByTestId("raid-boss-view-season-reference"))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("restores and shares a non-default season without dropping unrelated query parameters", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses?season=s2&view=compact")

    await screen.findByTestId("raid-boss-season-reference")
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/library/raid-bosses?season=s2&view=compact"
    )
    expect(screen.getByTestId("raid-boss-season-tier-5")).toBeInTheDocument()
  })

  it("records a changed season while preserving unrelated query parameters", async () => {
    const user = userEvent.setup()
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses?view=compact")

    await screen.findByTestId("raid-boss-season-reference")
    await user.click(screen.getByRole("combobox"))
    await user.click(
      screen.getByRole("option", {
        name: 'raidBosses.seasonLabel {"season":2}',
      })
    )

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?view=compact&season=s2"
      )
    )
  })

  it("canonicalizes an invalid season to the default selection", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses?season=missing&view=compact")

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?view=compact"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("keeps every season-board card reachable on the mobile form", async () => {
    useIsMobileMock.mockReturnValue(true)
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage()

    await screen.findByTestId("raid-boss-season-reference")
    expect(
      screen.getByRole("button", { name: "GuildBoss1MiniBoss1Warrior" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "GuildBoss1Boss1Tervigon" })
    ).toBeInTheDocument()
  })

  it("retains the compact mobile entity detail form", async () => {
    useIsMobileMock.mockReturnValue(true)
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    await screen.findByTestId("raid-boss-detail")
    expect(screen.getByTestId("raid-boss-list-bosses")).toBeInTheDocument()
  })

  it("recomputes the boss's stats when a prime HP-lost point is chosen", async () => {
    const user = userEvent.setup()
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    const adjusted = await screen.findByTestId("raid-boss-adjusted-stats")
    // Full HP by default -> no modifiers active.
    expect(adjusted).toHaveTextContent("raidBosses.noActiveModifiers")

    // One prime panel, one HP-lost select; choose its threshold.
    const [primeSelect] = within(adjusted).getAllByRole("combobox")
    await user.click(primeSelect)
    const options = await screen.findAllByRole("option")
    await user.click(options[options.length - 1])

    // bossStatPctDecrease dmg 20 -> damage row shows base 10 -> adjusted 8 (round(10 * 0.8)).
    await waitFor(() =>
      expect(within(adjusted).getByText("8")).toBeInTheDocument()
    )
    expect(within(adjusted).getByText("10")).toBeInTheDocument()
  })

  it("selecting a prime navigates to its detail route", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    const primes = await screen.findByTestId("raid-boss-list-primes")
    fireEvent.click(within(primes).getByText("GuildBoss1MiniBoss1Warrior"))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1MiniBoss1Warrior"
      )
    )
  })

  it("returns an unknown detail id to the season reference", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/not-a-real-id?season=s2")

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?season=s2"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("drops tampered encounter context as a group and retains direct-detail fallback", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage(
      "/library/raid-bosses/GuildBoss1Boss1Tervigon?season=s1&tier=6&set=0&encounter=1&view=compact"
    )

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1Boss1Tervigon?season=s1&view=compact"
      )
    )
    expect(screen.getByTestId("raid-boss-abilities")).toHaveTextContent(
      "Deals 30 damage"
    )
  })

  it("renders ability rules-text scaled to the selected progression step", async () => {
    const user = userEvent.setup()
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    // Default step is the highest known (encounter progressionIndex 3 -> ability level 3 -> dmg[2]).
    const abilities = await screen.findByTestId("raid-boss-abilities")
    expect(abilities).toHaveTextContent("Deals 30 damage")

    await user.click(screen.getByTestId("raid-boss-progression-select"))
    const options = await screen.findAllByRole("option")
    await user.click(options[0]) // step 1 -> ability level 1 -> dmg[0]

    await waitFor(() => expect(abilities).toHaveTextContent("Deals 10 damage"))
  })

  it("changes the progression step via the dropdown", async () => {
    const user = userEvent.setup()
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/GuildBoss4Boss1Ghazghkull")

    // Ghazghkull is never in an encounter -> defaults to the first step (rank 0 in the fixture).
    const stats = await screen.findByTestId("raid-boss-stats")
    expect(stats).toHaveTextContent("raidBosses.rank0")

    await user.click(screen.getByTestId("raid-boss-progression-select"))
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(3)
    await user.click(options[1])

    await waitFor(() => expect(stats).toHaveTextContent("raidBosses.rank1"))
  })
})
