import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

vi.mock("@workspace/ui/hooks/use-mobile", () => ({ useIsMobile: () => false }))
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
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && Object.keys(opts).filter((k) => k !== "defaultValue").length
        ? `${key} ${JSON.stringify(opts)}`
        : ((opts?.defaultValue as string) ?? key),
    i18n: { exists: () => true },
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
  seasonConfigRotation: ["s1"],
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
                  progressionIndex: 3,
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
                      type: "bossStatDecrease",
                      target: "damage",
                      amount: 2,
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

  it("renders Bosses and Primes sections and canonicalizes to the first entity", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage()

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1Boss1Tervigon"
      )
    )

    expect(screen.getByTestId("raid-boss-list-bosses")).toBeInTheDocument()
    const primes = screen.getByTestId("raid-boss-list-primes")
    expect(
      within(primes).getByText("GuildBoss1MiniBoss1Warrior")
    ).toBeInTheDocument()

    // Detail for the first boss: the Prime Modifiers section lists its set's prime with its modifier.
    const detail = screen.getByTestId("raid-boss-detail")
    const primeModifiers = within(detail).getByTestId(
      "raid-boss-prime-modifiers"
    )
    expect(primeModifiers).toHaveTextContent("GuildBoss1MiniBoss1Warrior")
    expect(primeModifiers).toHaveTextContent("−2 damage")
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

  it("falls back to the first entity for an unknown id in the path", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/not-a-real-id")

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1Boss1Tervigon"
      )
    )
  })

  it("steps through the progression ladder", async () => {
    getRaidBossesMock.mockResolvedValue(payload)
    renderPage("/library/raid-bosses/GuildBoss4Boss1Ghazghkull")

    const progression = await screen.findByTestId("raid-boss-progression")
    // Ghazghkull is never in an encounter -> defaults to step 1 of 3.
    expect(progression).toHaveTextContent("1 / 3")

    fireEvent.click(
      within(progression).getByRole("button", {
        name: "raidBosses.progressionNext",
      })
    )
    await waitFor(() => expect(progression).toHaveTextContent("2 / 3"))
  })
})
