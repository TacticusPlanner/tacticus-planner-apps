import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import userEvent from "@testing-library/user-event"
import { useLocation } from "react-router"

import { refreshLocalDataAfterSync } from "@/shared/local-data"
import {
  holdNamespaceLoads,
  i18n,
  requestedNamespaces,
} from "@/test/i18n-instance"
import { act, fireEvent, render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog } from "@/test/seed"

import { RaidBossesPage } from "./raid-bosses-page"

function at<T>(xs: readonly T[] | undefined, index: number): T {
  const value = xs?.[index]
  if (value === undefined) throw new Error(`expected an item at index ${index}`)
  return value
}

const { isMobileMock, useIsMobileMock } = vi.hoisted(() => {
  const isMobileMock = { value: false }
  const useIsMobileMock = vi.fn(() => isMobileMock.value)
  return { isMobileMock, useIsMobileMock }
})

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: useIsMobileMock,
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

// The page reads the real catalog; the boss's fixture ability text joins the real English resources.
const abilityTextFixture = {
  AbilityX: {
    description: "Deals {[dmg]} damage",
    variables: { dmg: [10, 20, 30] },
    constants: {},
    scaled: [],
  },
}

const characters = ["A", "B", "C", "D"].map((letter) => ({
  id: `hero${letter}`,
  name: `Hero ${letter}`,
}))
const mows = [{ id: "mowA", name: "MoW A" }]

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

const metaPayload = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  updatedOn: "2026-07-01",
  comps: [
    {
      id: "admech",
      signatureUnitId: "heroA",
      coreCharacterIds: ["heroA"],
      flexCharacterIds: ["heroB"],
      mowIds: ["mowA"],
    },
  ],
  bosses: [
    {
      bossUnitSetId: "GuildBoss1Boss1Tervigon",
      recommendations: [
        {
          kind: "meta" as const,
          heroSlots: ["heroA", "heroB", "heroC", "heroD", "missingHero"].map(
            (heroId, index) => ({
              heroId,
              roleId: index === 0 ? "signature" : "flex",
              essential: index === 0,
              replacementCharacterIds: [],
            })
          ),
          mowId: "mowA",
          compIds: ["admech"],
        },
      ],
    },
  ],
}

function Location() {
  const location = useLocation()
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  )
}

async function renderPage(
  entry = "/library/raid-bosses",
  { raidBosses = payload, meta }: { raidBosses?: unknown; meta?: unknown } = {}
) {
  await seedGameCatalog({
    characters,
    mows,
    ...(raidBosses ? { "raid-bosses": raidBosses } : {}),
    ...(meta ? { "guild-raid-meta": meta } : {}),
  })
  return render(
    <>
      <RaidBossesPage />
      <Location />
    </>,
    { route: "/library/raid-bosses/:entityId?", initialEntries: [entry] }
  )
}

/** Fails every IndexedDB read of one catalog store (the read's automatic retry included) until
 *  the returned spy is restored. */
function failReads(store: string) {
  const getAll = IDBObjectStore.prototype.getAll
  return vi
    .spyOn(IDBObjectStore.prototype, "getAll")
    .mockImplementation(function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore["getAll"]>
    ) {
      if (this.name === store) throw new Error("boom")
      return getAll.apply(this, args)
    })
}

// One namespace per ability, as the generator writes them (`raidBossAbilityText/<id>`).
beforeAll(() => {
  i18n.addResourceBundle(
    "en",
    "raidBossAbilityText/AbilityX",
    abilityTextFixture
  )
})
afterAll(() => {
  i18n.removeResourceBundle("en", "raidBossAbilityText/AbilityX")
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe("RaidBossesPage", () => {
  beforeEach(() => {
    isMobileMock.value = false
    useIsMobileMock.mockImplementation(() => isMobileMock.value)
    useIsMobileMock.mockClear()
  })

  it("shows the feature-unavailable state when the dataset has not synced", async () => {
    await renderPage(undefined, { raidBosses: null })

    await waitFor(() =>
      expect(screen.getByTestId("raid-bosses-library-page")).toHaveTextContent(
        "Guild Raid Boss data is not available in the catalog yet."
      )
    )
  })

  it("shows a retry-able failure state when the dataset read throws, and recovers on retry", async () => {
    const user = userEvent.setup()
    const failing = failReads("raid-bosses")
    await renderPage()

    const failure = await screen.findByTestId("raid-bosses-sync-failed")
    expect(failure).toHaveTextContent(
      "Couldn't load Guild Raid Bosses. The catalog may still be syncing."
    )

    failing.mockRestore()
    await user.click(screen.getByRole("button", { name: "Retry" }))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("renders the season reference and opens a contextual encounter detail", async () => {
    const user = userEvent.setup()
    await renderPage()

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
    await renderPage(
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
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

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
    await renderPage("/library/raid-bosses?season=s2&view=compact")

    await screen.findByTestId("raid-boss-season-reference")
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/library/raid-bosses?season=s2&view=compact"
    )
    expect(screen.getByTestId("raid-boss-season-tier-5")).toBeInTheDocument()
  })

  it("records a changed season while preserving unrelated query parameters", async () => {
    const user = userEvent.setup()
    await renderPage("/library/raid-bosses?view=compact")

    await screen.findByTestId("raid-boss-season-reference")
    await user.click(screen.getByRole("combobox"))
    await user.click(
      screen.getByRole("option", {
        name: "Season 2",
      })
    )

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?view=compact&season=s2"
      )
    )
  })

  it("canonicalizes an invalid season to the default selection", async () => {
    await renderPage("/library/raid-bosses?season=missing&view=compact")

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?view=compact"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("keeps every season-board card reachable on the mobile form", async () => {
    useIsMobileMock.mockReturnValue(true)
    await renderPage()

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
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    await screen.findByTestId("raid-boss-detail")
    expect(screen.getByTestId("raid-boss-mobile-picker")).toBeInTheDocument()
  })

  it("selects an entity from the mobile picker and shows its detail", async () => {
    useIsMobileMock.mockReturnValue(true)
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    await screen.findByTestId("raid-boss-detail")
    fireEvent.click(screen.getByTestId("raid-boss-mobile-picker"))
    fireEvent.change(screen.getByPlaceholderText("Search bosses and primes…"), {
      target: { value: "Warrior" },
    })
    fireEvent.click(await screen.findByRole("option"))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1MiniBoss1Warrior"
      )
    )
    await screen.findByTestId("raid-boss-detail")
  })

  it("switches to Season Config and keeps its selected season in the shareable URL", async () => {
    const user = userEvent.setup()
    await renderPage()

    await screen.findByTestId("raid-boss-tabs")
    await user.click(screen.getByRole("tab", { name: "Seasons Config" }))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=seasons"
      )
    )
    expect(screen.getByTestId("raid-boss-seasons")).toBeInTheDocument()
    expect(
      screen.getByTestId("raid-boss-season-desktop-table")
    ).toHaveTextContent("chest-0")
  })

  it("uses the expandable mobile Season Config layout below the breakpoint", async () => {
    isMobileMock.value = true
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=seasons")

    await screen.findByTestId("raid-boss-seasons")
    expect(
      screen.getByTestId("raid-boss-season-mobile-cards")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("raid-boss-season-desktop-table")
    ).not.toBeInTheDocument()
  })

  it("renders a readable, image-free fallback for an unresolved season encounter", async () => {
    const unresolvedPayload = {
      ...payload,
      seasons: {
        s1: {
          ...payload.seasons.s1,
          tiers: [
            {
              ...at(payload.seasons.s1.tiers, 0),
              sets: [
                {
                  ...at(at(payload.seasons.s1.tiers, 0).sets, 0),
                  encounters: [
                    {
                      ...at(
                        at(at(payload.seasons.s1.tiers, 0).sets, 0).encounters,
                        0
                      ),
                      unitSetId: "UnknownEncounter",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    }
    await renderPage(
      "/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=seasons",
      { raidBosses: unresolvedPayload }
    )

    expect(await screen.findByText("Unknown Encounter")).toBeInTheDocument()
    expect(
      screen.queryByRole("img", { name: "Unknown Encounter" })
    ).not.toBeInTheDocument()
  })

  it("renders Meta recommendations and persists its Comp filter in the URL", async () => {
    const user = userEvent.setup()
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=meta", {
      meta: metaPayload,
    })

    const recommendations = await screen.findByTestId(
      "raid-boss-meta-recommendations"
    )
    expect(recommendations).toHaveTextContent("Hero A")
    expect(recommendations).toHaveTextContent("Hero D")
    expect(recommendations).toHaveTextContent("missing Hero")
    expect(recommendations).toHaveTextContent("MoW A")
    expect(
      screen.getByRole("link", { name: "Terminus Maximus" })
    ).toHaveAttribute(
      "href",
      "https://terminusmaximus.com/guild-raid/boss-meta/"
    )
    expect(screen.getByTestId("raid-boss-meta-comps")).toHaveTextContent(
      "admech"
    )

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by Comp" }),
      "admech"
    )

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=meta&comp=admech"
      )
    )

    await user.click(screen.getByRole("button", { name: "admech" }))
    expect(
      await screen.findByTestId("raid-boss-meta-comp-guidance")
    ).toHaveTextContent("Hero B")
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=meta&comp=admech"
    )
  })

  it("uses stacked touch-friendly Meta cards below the breakpoint", async () => {
    isMobileMock.value = true
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=meta", {
      meta: metaPayload,
    })

    expect(
      await screen.findByTestId("raid-boss-meta-recommendations")
    ).toHaveClass("flex")
    expect(screen.getByTestId("raid-boss-tabs")).toHaveClass("overflow-x-auto")
  })

  it("keeps Details usable when Meta is absent and shows a Meta-only unavailable state", async () => {
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=meta")

    expect(
      await screen.findByTestId("raid-boss-meta-unavailable")
    ).toHaveTextContent("Guild Raid Boss Meta is not available yet.")
    expect(screen.queryByTestId("raid-boss-detail")).not.toBeInTheDocument()
  })

  it("retries a failed Meta read without blocking the tab", async () => {
    const user = userEvent.setup()
    const failing = failReads("guild-raid-meta")
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=meta", {
      meta: metaPayload,
    })

    const failure = await screen.findByTestId("raid-boss-meta-failed")
    failing.mockRestore()
    await user.click(within(failure).getByRole("button", { name: "Retry" }))

    expect(
      await screen.findByTestId("raid-boss-meta-recommendations")
    ).toHaveTextContent("Hero A")
  })

  it("renders an empty Meta result when valid data has no recommendations", async () => {
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=meta", {
      meta: { ...metaPayload, bosses: [] },
    })

    expect(await screen.findByTestId("raid-boss-meta-empty")).toHaveTextContent(
      "No recommendations match this Comp."
    )
  })

  // A sync delivers the roster and the Meta dataset in either order, each refreshing only its own
  // read; the repaired URL must not depend on which one lands first.
  it.each([
    { first: "guild-raid-meta", second: "raid-bosses" },
    { first: "raid-bosses", second: "guild-raid-meta" },
  ] as const)(
    "repairs invalid tab, season, and Comp parameters without losing unrelated query state ($first first)",
    async ({ first, second }) => {
      const datasets = {
        "raid-bosses": payload,
        "guild-raid-meta": metaPayload,
      }
      const { queryClient } = await renderPage(
        "/library/raid-bosses/not-real?tab=invalid&season=invalid&comp=invalid&source=shared",
        {
          raidBosses: first === "raid-bosses" ? payload : null,
          meta: first === "guild-raid-meta" ? metaPayload : undefined,
        }
      )
      if (first === "guild-raid-meta") {
        await screen.findByText(
          "Guild Raid Boss data is not available in the catalog yet."
        )
      } else {
        await screen.findByTestId("raid-boss-tabs")
      }
      await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
      await seedGameCatalog({ [second]: datasets[second] })
      act(() => refreshLocalDataAfterSync(queryClient, "catalog", [second]))

      await waitFor(() =>
        expect(screen.getByTestId("location")).toHaveTextContent(
          "/library/raid-bosses/GuildBoss1Boss1Tervigon?tab=details&season=s1&source=shared"
        )
      )
    }
  )

  it("recomputes the boss's stats when a prime HP-lost point is chosen", async () => {
    const user = userEvent.setup()
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    const adjusted = await screen.findByTestId("raid-boss-adjusted-stats")
    // Full HP by default -> no modifiers active.
    expect(adjusted).toHaveTextContent("No modifiers active at this point.")

    // One prime panel, one HP-lost select; choose its threshold.
    const [primeSelect] = within(adjusted).getAllByRole("combobox")
    if (!primeSelect) throw new Error("expected a prime select")
    await user.click(primeSelect)
    const options = await screen.findAllByRole("option")
    await user.click(at(options, options.length - 1))

    // bossStatPctDecrease dmg 20 -> damage row shows base 10 -> adjusted 8 (round(10 * 0.8)).
    await waitFor(() =>
      expect(within(adjusted).getByText("8")).toBeInTheDocument()
    )
    expect(within(adjusted).getByText("10")).toBeInTheDocument()
  })

  it("selecting a prime navigates to its detail route", async () => {
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    const primes = await screen.findByTestId("raid-boss-list-primes")
    fireEvent.click(within(primes).getByText("GuildBoss1MiniBoss1Warrior"))

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses/GuildBoss1MiniBoss1Warrior"
      )
    )
  })

  it("returns an unknown detail id to the season reference", async () => {
    await renderPage("/library/raid-bosses/not-a-real-id?season=s2")

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/library/raid-bosses?season=s2"
      )
    )
    expect(screen.getByTestId("raid-boss-season-reference")).toBeInTheDocument()
  })

  it("drops tampered encounter context as a group and retains direct-detail fallback", async () => {
    await renderPage(
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
    await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon")

    // Default step is the highest known (encounter progressionIndex 3 -> ability level 3 -> dmg[2]).
    const abilities = await screen.findByTestId("raid-boss-abilities")
    expect(abilities).toHaveTextContent("Deals 30 damage")

    await user.click(screen.getByTestId("raid-boss-progression-select"))
    const options = await screen.findAllByRole("option")
    await user.click(at(options, 0)) // step 1 -> ability level 1 -> dmg[0]

    await waitFor(() => expect(abilities).toHaveTextContent("Deals 10 damage"))
  })

  describe("rules text", () => {
    // A real ability (its file loads through the test backend), a listed gap (no file, never
    // requested) and an id with neither (its download fails).
    const withAbilities = {
      ...payload,
      bosses: [
        unit("GuildBoss1Boss1Tervigon", "boss", {
          activeAbilityIds: ["ATemptingTrap", "MawClawsofThyrax"],
          passiveAbilityIds: ["AbilityGone"],
          traitIds: ["Flying"],
        }),
      ],
    }
    afterEach(() => {
      i18n.removeResourceBundle("en", "raidBossAbilityText/AbilityGone")
    })

    it("paints the detail view first and fetches only the shown abilities", async () => {
      requestedNamespaces.length = 0
      const release = holdNamespaceLoads()
      await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon", {
        raidBosses: withAbilities,
      })
      const abilities = await screen.findByTestId("raid-boss-abilities")
      expect(screen.getByTestId("raid-boss-stats")).toBeInTheDocument()
      expect(abilities).toHaveTextContent("A Tempting Trap")
      expect(
        within(abilities).getByTestId(
          "raid-boss-ability-ATemptingTrap-text-loading"
        )
      ).toHaveTextContent("Loading rules text…")

      act(release)
      await waitFor(() =>
        expect(
          within(abilities).queryByTestId(
            "raid-boss-ability-ATemptingTrap-text-loading"
          )
        ).not.toBeInTheDocument()
      )
      expect(requestedNamespaces.sort()).toEqual([
        "en/raidBossAbilityText/ATemptingTrap",
        "en/raidBossAbilityText/AbilityGone",
      ])
      // The gap shows its name alone: no note, no description.
      expect(
        within(abilities).queryByTestId(
          "raid-boss-ability-MawClawsofThyrax-text-failed"
        )
      ).not.toBeInTheDocument()
    })

    it("shows a failure note with a retry, and the text once a retry succeeds", async () => {
      await renderPage("/library/raid-bosses/GuildBoss1Boss1Tervigon", {
        raidBosses: withAbilities,
      })
      const failed = await screen.findByTestId(
        "raid-boss-ability-AbilityGone-text-failed"
      )
      expect(failed).toHaveTextContent("The rules text couldn't be loaded.")

      i18n.addResourceBundle("en", "raidBossAbilityText/AbilityGone", {
        AbilityGone: {
          description: "Back again",
          variables: {},
          constants: {},
          scaled: [],
        },
      })
      fireEvent.click(within(failed).getByRole("button", { name: "Retry" }))
      await waitFor(() =>
        expect(screen.getByTestId("raid-boss-abilities")).toHaveTextContent(
          "Back again"
        )
      )
      expect(
        screen.queryByTestId("raid-boss-ability-AbilityGone-text-failed")
      ).not.toBeInTheDocument()
    })
  })

  it("changes the progression step via the dropdown", async () => {
    const user = userEvent.setup()
    await renderPage("/library/raid-bosses/GuildBoss4Boss1Ghazghkull")

    // Ghazghkull is never in an encounter -> defaults to the first step (rank 0 in the fixture).
    const stats = await screen.findByTestId("raid-boss-stats")
    expect(stats).toHaveTextContent("Rank0")

    await user.click(screen.getByTestId("raid-boss-progression-select"))
    const options = await screen.findAllByRole("option")
    expect(options).toHaveLength(3)
    await user.click(at(options, 1))

    await waitFor(() => expect(stats).toHaveTextContent("Rank1"))
  })
})
