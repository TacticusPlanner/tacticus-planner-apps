import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { guildWarFixture } from "@workspace/game-catalog/testing"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, waitFor, within } from "@/test/render"
import { resetTestDatabases, seedGameCatalog } from "@/test/seed"

import type { GuildWar, GuildWarAttack } from "../../model/types"

const api = vi.hoisted(() => ({ past: vi.fn() }))

vi.mock("@/shared/tour", () => ({ useTourPageSteps: vi.fn() }))
vi.mock("@/shared/api", async (importOriginal) => {
  const { fakeApiClient } = await import("@/test/fake-api-client")
  return {
    ...(await importOriginal<typeof import("@/shared/api")>()),
    apiClient: fakeApiClient((call) =>
      call.path === "/api/v1/guild-wars"
        ? api.past(call.params?.query?.after ?? null)
        : undefined
    ),
  }
})

import { HistoryPage } from "./history-page"

const attack = (
  id: string,
  characterIds: string[],
  overrides: Partial<GuildWarAttack> = {}
): GuildWarAttack => ({
  id,
  revision: 1,
  attackedAt: "2026-11-21T10:00:00Z",
  zoneId: "Armoury",
  slot: 2,
  rarityCap: "Epic",
  characters: characterIds.map((unitId) => ({
    unitId,
    progression: "Legendary:RedFiveStars",
    rank: "Diamond3",
    xpLevel: 50,
    abilityLevels: [40, 35],
  })),
  mow: null,
  result: "won",
  lostUnitIds: [],
  notes: null,
  enemy: null,
  ...overrides,
})

const war = (id: string, attacks: GuildWarAttack[]): GuildWar => ({
  id,
  revision: 1,
  seasonId: "guildWarSeasonA",
  battlefieldLevel: 5,
  startedAt: "2026-11-10T10:00:00Z",
  endedAt: "2026-11-17T10:00:00Z",
  tokensUsed: attacks.length,
  deployedUnitIds: attacks.flatMap((entry) =>
    entry.characters.map((unit) => unit.unitId)
  ),
  attacks,
})

function renderHistory() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>
  )
}

describe("HistoryPage", () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    await seedGameCatalog({ "guild-war": guildWarFixture })
  })
  afterEach(async () => {
    await resetTestDatabases()
  })

  it("says there are no past wars yet", async () => {
    api.past.mockResolvedValue({ items: [], nextAfter: null })
    renderHistory()

    expect(
      await screen.findByTestId("guild-war-history-empty")
    ).toHaveTextContent("No past wars yet.")
  })

  it("totals the wars and expands one to its attacks", async () => {
    const user = userEvent.setup()
    api.past.mockResolvedValue({
      items: [
        war("war-2", [
          attack("a1", ["ultraCalgar", "ultraTitus"]),
          attack("a2", ["ultraTigurius"], {
            result: "lost",
            lostUnitIds: ["ultraTigurius"],
            notes: "Ran out of time.",
            enemy: {
              characters: [
                {
                  unitId: "ultraTitus",
                  rarity: "Epic",
                  rank: null,
                  state: "killed",
                },
              ],
              mow: null,
              buffIds: ["EnvFortified_Local"],
              boardId: null,
            },
          }),
        ]),
        war("war-1", [attack("a3", ["ultraCalgar", "ultraTitus"])]),
      ],
      nextAfter: null,
    })
    renderHistory()

    const totals = await screen.findByTestId("guild-war-totals")
    // Three attacks with a result on Epic slots, two of them won.
    expect(within(totals).getByTestId("guild-war-by-rarity")).toHaveTextContent(
      "67% · 3 attacks"
    )
    // The Calgar and Titus lineup is the only one used twice, and won both times.
    expect(within(totals).getByTestId("guild-war-lineups")).toHaveTextContent(
      "100% · 2 attacks"
    )
    expect(within(totals).getByTestId("guild-war-overall")).toHaveTextContent(
      /Attacks3Won2Lost1Units lost1/
    )
    expect(within(totals).getByTestId("guild-war-by-zone")).toHaveTextContent(
      "67% · 3 attacks"
    )
    expect(
      within(totals).getAllByTestId("guild-war-characters")[0]
    ).toHaveTextContent("100% · 2 attacks")
    expect(within(totals).getByTestId("guild-war-enemies")).toHaveTextContent(
      "1 loss"
    )

    const [newest] = screen.getAllByTestId("guild-war-past-war")
    expect(newest).toHaveTextContent("2 · 1 won · 1 lost")
    expect(screen.queryByTestId("guild-war-attack")).toBeNull()
    await user.click(within(newest as HTMLElement).getByRole("button"))
    const rows = screen.getAllByTestId("guild-war-attack")
    expect(rows).toHaveLength(2)
    expect(rows[1]).toHaveTextContent("Armoury · Epic")
    expect(
      within(rows[1] as HTMLElement).getByTestId("attack-notes")
    ).toHaveTextContent("Ran out of time.")
    expect(
      within(rows[1] as HTMLElement).getByTestId("attack-enemy")
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Load more wars" })).toBeNull()
  })

  it("loads the next page with the returned cursor", async () => {
    const user = userEvent.setup()
    api.past.mockImplementation((after: string | null) =>
      Promise.resolve(
        after === null
          ? { items: [war("war-2", [])], nextAfter: "cursor-1" }
          : { items: [war("war-1", [])], nextAfter: null }
      )
    )
    renderHistory()

    await user.click(
      await screen.findByRole("button", { name: "Load more wars" })
    )

    await waitFor(() =>
      expect(screen.getAllByTestId("guild-war-past-war")).toHaveLength(2)
    )
    expect(api.past).toHaveBeenLastCalledWith("cursor-1")
    expect(screen.queryByRole("button", { name: "Load more wars" })).toBeNull()
  })
})
