import type { InitialEntry } from "react-router"
import { useLocation } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { unitOriginState } from "@/entities/unit"
import type { ReadState } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import { enNpcAbilityText } from "@/test/rules-text"

import { progressionRulesFixture } from "@workspace/game-catalog/testing"

import { MowUnitPage } from "./mow-unit-page"

const env = vi.hoisted(() => ({
  tour: undefined as
    | { desktop: { target: unknown }[]; mobile?: { target: unknown }[] }
    | undefined,
  isMobile: false,
  abilityText: {} as Record<string, unknown>,
  /** The rules-text load: settled by default; `ready: false` while it downloads. */
  rules: { ready: true, failed: false },
  abilityIds: [] as readonly string[],
  retries: 0,
  power: {
    status: "loading",
    retry: () => {},
  } as ReadState<UnitPowerContext | null>,
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => env.isMobile,
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: typeof env.tour) => {
    env.tour = steps
  },
}))
vi.mock("@/shared/unit-power", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUnitPowerContext: () => env.power,
}))
vi.mock("@/shared/ability-text", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAbilityText: (ids: readonly string[]) => {
    env.abilityIds = ids
    return {
      ...env.rules,
      retry: () => {
        env.retries += 1
      },
      text: (id: string) =>
        env.rules.ready || env.abilityText[id]
          ? env.abilityText[id]
          : undefined,
    }
  },
}))

// Galatian's first two recipes per ability are the catalog's; later levels reuse one recipe.
const later = ["upgHpC002", "upgDmgC001", "upgArmC001"]
const recipes = (first: string[][]) =>
  Array.from({ length: 60 }, (_, index) => first[index] ?? later)
const galatian = {
  id: "ultraDreadnought",
  name: "Galatian",
  faction: "Ultramarines",
  alliance: "Imperial",
  unitKind: "MachineOfWar",
  primaryAbility: {
    name: "DutyEternal",
    recipes: recipes([
      ["upgHpC002", "upgDmgC001", "upgArmC001"],
      ["upgHpC014", "upgDmgC012", "upgArmC013"],
    ]),
  },
  secondaryAbility: {
    name: "MacroPlasmaIncinerator",
    recipes: recipes([["upgHpC002", "upgDmgC013", "upgArmC001"]]),
  },
  mythicAbility: { name: "WisdomOfTheAncients" } as
    { name: string } | undefined,
}
const biovore = {
  ...galatian,
  id: "tyranBiovore",
  name: "Biovore",
  faction: "Tyranids",
  alliance: "Xenos",
  primaryAbility: { ...galatian.primaryAbility, name: "SporeMine" },
  secondaryAbility: { ...galatian.secondaryAbility, name: "Biomorph" },
  mythicAbility: { name: "HyperCorrosiveAcid" },
}
const reanimator = {
  ...galatian,
  id: "necroReanimator",
  name: "Reanimator",
  faction: "Necrons",
  alliance: "Xenos",
  primaryAbility: { ...galatian.primaryAbility, name: "ReanimationBeam" },
  secondaryAbility: {
    ...galatian.secondaryAbility,
    name: "ReanimationProtocols",
  },
  mythicAbility: undefined,
}

// Rungs 2 and 3 are the catalog's; the rest only have to exist up to level 60.
const costs = Array.from({ length: 59 }, (_, index) => {
  const level = index + 2
  return {
    level,
    gold: level === 2 ? 15 : level === 3 ? 30 : 100,
    salvage: level <= 3 ? 5 : 0,
    badges: { rarity: "Common", amount: 1 },
    forgeBadges: null,
    components: 1,
  }
})

const upgrade = (id: string) => ({
  id,
  label: id,
  rarity: "Common",
  stat: "Health",
  craftable: false,
  recipe: [],
  farmLocations: [],
})

const upgrades = [
  "upgHpC002",
  "upgDmgC001",
  "upgArmC001",
  "upgHpC014",
  "upgDmgC012",
  "upgArmC013",
  "upgDmgC013",
].map(upgrade)

const ownedGalatian = {
  unitId: "ultraDreadnought",
  progressionIndex: "Epic:RedOneStar",
  xp: 0,
  xpLevel: 1,
  shards: 0,
  mythicShards: 0,
  abilities: [
    { abilityId: "raw1", level: 30 },
    { abilityId: "raw2", level: 28 },
  ],
  appliedUpgradeSlots: [],
}

const inventory = {
  abilityBadges: {
    imperial: [{ rarity: "Common", amount: 2 }],
    xenos: [],
    chaos: [],
  },
  forgeBadges: [],
  components: {
    imperial: { amount: 5 },
    xenos: { amount: 0 },
    chaos: { amount: 0 },
  },
}

type Catalog = { costsSynced?: boolean; galatianMythic?: boolean }

async function seedCatalog({
  costsSynced = true,
  galatianMythic = true,
}: Catalog = {}) {
  await seedGameCatalog({
    mows: [
      galatianMythic ? galatian : { ...galatian, mythicAbility: undefined },
      biovore,
      reanimator,
    ],
    ...(costsSynced ? { "mow-upgrade-costs": costs } : {}),
    upgrades,
    "unlock-shard-costs": [{ rarity: "Common", shards: 40 }],
    "progression-rules": [progressionRulesFixture],
  })
}

// A signed-in player whose player-data reads never settle: hold every request against that
// database (Dexie waits on a request that never fires), leaving the catalog's reads alone.
function holdPlayerDataReads() {
  for (const method of ["get", "getAll", "openCursor"] as const) {
    const original = IDBObjectStore.prototype[method] as (
      ...args: unknown[]
    ) => IDBRequest
    vi.spyOn(IDBObjectStore.prototype, method).mockImplementation(function (
      this: IDBObjectStore,
      ...args: unknown[]
    ) {
      return this.transaction.db.name === "tacticus-planner-player-data"
        ? ({} as IDBRequest)
        : original.apply(this, args)
    } as never)
  }
}

function Where() {
  const location = useLocation()
  return (
    <output data-testid="where">
      {location.pathname}
      {location.search}
    </output>
  )
}

/**
 * Seeds the catalog (and, when given, a signed-in player's chunks — or "pending" for reads that
 * never settle), then opens the unit page and waits for the catalog gate to clear.
 */
async function renderUnit(
  url: string,
  {
    state,
    catalog,
    player,
  }: {
    state?: unknown
    catalog?: Catalog
    player?: Parameters<typeof seedPlayerData>[0] | "pending"
  } = {}
) {
  await seedCatalog(catalog)
  if (player === "pending") {
    holdPlayerDataReads()
  } else if (player) {
    await seedPlayerData(player)
  }
  const [pathname, search] = url.split("?")
  const entry: InitialEntry = {
    pathname,
    search: search ? `?${search}` : "",
    state,
  }
  const { queryClient } = render(
    <>
      <MowUnitPage />
      <Where />
    </>,
    {
      route: "/library/machines-of-war/:entityId",
      // The harness types entries as paths; the memory router also takes a location with state.
      initialEntries: [entry as unknown as string],
      auth: player ? { authenticated: true } : undefined,
    }
  )
  if (catalog?.costsSynced !== false) {
    await waitFor(() =>
      expect(screen.queryByTestId("mow-unit-loading")).not.toBeInTheDocument()
    )
  }
  // Let the page's other catalog reads (the progression rules) settle before the test looks; a
  // settled read renders on a later timer tick.
  await waitFor(() =>
    expect(queryClient.isFetching({ queryKey: ["local", "catalog"] })).toBe(0)
  )
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
  if (player && player !== "pending") {
    // The player's reads have settled once the header states ownership either way.
    await waitFor(() =>
      expect(
        screen.queryByTestId("unit-your-line") ??
          screen.queryByTestId("unit-not-unlocked")
      ).toBeInTheDocument()
    )
  }
}

const total = (key: string) =>
  within(screen.getByTestId(`mow-total-${key}`)).getByRole("definition")
    .textContent

async function pick(trigger: string, option: string) {
  fireEvent.click(screen.getByTestId(trigger))
  fireEvent.click(await screen.findByRole("option", { name: option }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("MowUnitPage", () => {
  beforeEach(() => {
    env.isMobile = false
    env.abilityText = enNpcAbilityText
    env.rules = { ready: true, failed: false }
    env.retries = 0
    env.power = {
      status: "ready",
      data: unitPowerContextFixture(),
      retry: () => {},
    }
  })

  it("shows the MoW's details, not the placeholder", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Galatian"
    )
    expect(screen.getByTestId("unit-tab-details")).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.queryByText(/aren't available yet/)).not.toBeInTheDocument()
    expect(screen.getByTestId("unit-header")).toHaveTextContent(
      "Imperial · Machine of War"
    )
  })

  it("waits for the upgrade cost ladder before showing the page", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought", {
      catalog: { costsSynced: false },
    })
    expect(await screen.findByTestId("mow-unit-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("unit-header")).not.toBeInTheDocument()
  })

  it("shows the not-found state for an id that isn't a MoW", async () => {
    await renderUnit("/library/machines-of-war/notAMow")
    expect(screen.getByTestId("mow-unit-not-found")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Machines of War" })
    ).toHaveAttribute("href", "/library/machines-of-war")
  })

  it("opens Ability upgrades from the URL and falls back to Details for an unknown tab", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought?tab=upgrades")
    expect(screen.getByTestId("mow-upgrades")).toBeInTheDocument()
  })

  it("shows Details for an unknown tab value", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought?tab=rankup")
    expect(screen.getByTestId("unit-details")).toBeInTheDocument()
  })

  it("follows the list order for prev/next, keeps the tab, and goes back to the list", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought?tab=upgrades")
    expect(
      screen.getByRole("link", { name: /Machines of War/ })
    ).toHaveAttribute("href", "/library/machines-of-war")
    // Imperial before Xenos, then by faction: Galatian, Reanimator, Biovore.
    fireEvent.click(screen.getByRole("link", { name: /Next unit: Reanimator/ }))
    await waitFor(() =>
      expect(screen.getByTestId("where")).toHaveTextContent(
        "/library/machines-of-war/necroReanimator?tab=upgrades"
      )
    )
  })

  it("returns to Collection and walks Collection's Machine of War order when opened from Collection", async () => {
    // Collection order (Biovore, Galatian, Reanimator) differs from the list's default order.
    await renderUnit("/library/machines-of-war/ultraDreadnought?tab=upgrades", {
      state: unitOriginState({
        kind: "collection",
        ids: ["tyranBiovore", "ultraDreadnought", "necroReanimator"],
      }),
    })

    const back = screen.getByTestId("unit-nav-back")
    expect(back).toHaveAttribute("href", "/my-game/collection")
    expect(back).toHaveTextContent("Collection")
    expect(back).toHaveAccessibleName("Back to Collection")
    expect(screen.getByTestId("unit-nav-position")).toHaveTextContent("2 of 3")
    expect(
      screen.getByRole("link", { name: /Previous unit: Biovore/ })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("link", { name: /Next unit: Reanimator/ }))
    await waitFor(() =>
      expect(screen.getByTestId("where")).toHaveTextContent(
        "/library/machines-of-war/necroReanimator?tab=upgrades"
      )
    )
    expect(screen.getByTestId("unit-nav-position")).toHaveTextContent("3 of 3")
    expect(screen.getByTestId("unit-nav-next")).toBeDisabled()
    expect(screen.getByTestId("unit-nav-back")).toHaveAttribute(
      "href",
      "/my-game/collection"
    )
  })

  it("keeps the Machines of War list as the back target without an origin", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought")

    expect(screen.getByTestId("unit-nav-back")).toHaveAccessibleName(
      "Back to Machines of War"
    )
  })

  it("shows rules text, a stepper, the next level and a chart for both abilities", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    for (const [ability, name, text] of [
      ["primary", "Duty Eternal", "200 Health"],
      ["secondary", "Macro Plasma Incinerator", "30-"],
    ] as const) {
      const panel = screen.getByTestId(`unit-ability-${ability}`)
      expect(panel).toHaveTextContent(name)
      expect(panel).toHaveTextContent(text)
      expect(
        screen.getByTestId(`unit-ability-${ability}-stepper`)
      ).toBeInTheDocument()
      expect(
        screen.getByTestId(`unit-ability-${ability}-next`)
      ).toBeInTheDocument()
      expect(within(panel).getAllByRole("figure").length).toBeGreaterThan(0)
      expect(
        screen.queryByTestId(`unit-ability-${ability}-missing-text`)
      ).not.toBeInTheDocument()
    }
  })

  it("resolves cooldown and munition constants keyed with a trailing space", async () => {
    await renderUnit("/library/machines-of-war/necroReanimator")
    const panel = screen.getByTestId("unit-ability-primary")
    expect(panel).toHaveTextContent("Reanimation Beam")
    expect(panel).toHaveTextContent("Initial cooldown: 1 round")
    expect(panel).toHaveTextContent("Cost: 1 munition")
    expect(panel).not.toHaveTextContent("initialCooldownTurns")
    expect(panel).not.toHaveTextContent("munitionsCost")
  })

  it("shows both abilities without rules text in the missing-text state", async () => {
    env.abilityText = {}
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    for (const [ability, name] of [
      ["primary", "Duty Eternal"],
      ["secondary", "Macro Plasma Incinerator"],
    ]) {
      const panel = screen.getByTestId(`unit-ability-${ability}`)
      expect(panel).toHaveTextContent(name!)
      expect(
        screen.getByTestId(`unit-ability-${ability}-missing-text`)
      ).toHaveTextContent("Rules text isn't in the planner yet.")
      expect(
        screen.queryByTestId(`unit-ability-${ability}-stepper`)
      ).not.toBeInTheDocument()
      expect(within(panel).queryByRole("figure")).not.toBeInTheDocument()
    }
  })

  it("paints the page before the rules text arrives, asking only for its own abilities", async () => {
    env.abilityText = {}
    env.rules = { ready: false, failed: false }
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Galatian"
    )
    expect(env.abilityIds).toEqual([
      "DutyEternal",
      "MacroPlasmaIncinerator",
      "WisdomOfTheAncients",
    ])
    for (const ability of ["primary", "secondary"]) {
      expect(
        screen.getByTestId(`unit-ability-${ability}-text-loading`)
      ).toHaveTextContent("Loading rules text…")
      expect(
        screen.queryByTestId(`unit-ability-${ability}-missing-text`)
      ).not.toBeInTheDocument()
    }
  })

  it("shows a failure note with a retry when the rules text failed to download", async () => {
    env.abilityText = {}
    env.rules = { ready: true, failed: true }
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    const panel = screen.getByTestId("unit-ability-primary")
    expect(within(panel).getByRole("alert")).toHaveTextContent(
      "The rules text couldn't be loaded."
    )
    fireEvent.click(within(panel).getByRole("button", { name: "Retry" }))
    expect(env.retries).toBe(1)
  })

  it("turns the panel on when rules text exists, up to the ladder's top level", async () => {
    env.abilityText = {
      DutyEternal: enNpcAbilityText.DutyEternal,
    }
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    expect(
      screen.getByTestId("unit-ability-primary-stepper")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("unit-ability-secondary-missing-text")
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByTestId("unit-ability-primary-chart-summonHp-column-59")
    )
    expect(
      screen.getByTestId("unit-ability-primary-stepper-value")
    ).toHaveTextContent("Lv 60")
  })

  it("opens an owned MoW at the player's values, with no rank", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought", {
      player: { mows: [ownedGalatian] },
    })
    expect(screen.getByTestId("unit-your-line")).toHaveTextContent(
      "Your Machine of War: Epic · Red One Star · primary 30 · secondary 28"
    )
    expect(screen.getByTestId("unit-values-base")).toHaveTextContent(
      "Your unit"
    )
    expect(screen.getByTestId("unit-ability-primary")).toHaveTextContent(
      "Yours: level 30"
    )
    expect(screen.getByTestId("unit-ability-secondary")).toHaveTextContent(
      "Yours: level 28"
    )
  })

  describe("Power", () => {
    const maxedBiovore = {
      ...ownedGalatian,
      unitId: "tyranBiovore",
      progressionIndex: "Mythic:MythicWings",
      abilities: [
        { abilityId: "raw1", level: 60 },
        { abilityId: "raw2", level: 60 },
      ],
    }

    it("shows a maxed MoW's power in the header and follows Custom stars", async () => {
      await renderUnit("/library/machines-of-war/tyranBiovore", {
        player: { mows: [maxedBiovore] },
      })
      const values = within(screen.getByTestId("unit-values"))
      expect(values.getByTestId("unit-power")).toHaveTextContent("Power")
      expect(values.getByTestId("unit-power-value")).toHaveTextContent(
        "1,040,687"
      )

      fireEvent.click(screen.getByTestId("unit-values-custom"))
      fireEvent.click(values.getByRole("combobox"))
      fireEvent.click(
        // Legendary and Mythic both have a one-blue-star step; Mythic's comes last.
        (await screen.findAllByRole("option", { name: /One Blue Star/ })).at(
          -1
        )!
      )
      expect(screen.getByTestId("unit-power-value")).toHaveTextContent(
        "873,548"
      )
      expect(screen.getByTestId("unit-ability-primary")).toHaveTextContent(
        "Yours: level 60"
      )
    })

    it("shows a placeholder while the power data loads", async () => {
      env.power = { status: "loading", retry: () => {} }
      await renderUnit("/library/machines-of-war/tyranBiovore")
      expect(screen.getByTestId("unit-power-loading")).toBeInTheDocument()
    })

    it("hides the power and keeps the panels and tabs when the data failed", async () => {
      env.power = { status: "error", retry: () => {} }
      await renderUnit("/library/machines-of-war/tyranBiovore", {
        player: { mows: [maxedBiovore] },
      })
      expect(screen.queryByTestId("unit-power")).not.toBeInTheDocument()
      expect(screen.getByTestId("unit-ability-primary")).toBeInTheDocument()
      expect(screen.getByTestId("unit-ability-secondary")).toBeInTheDocument()
      fireEvent.click(screen.getByTestId("unit-tab-upgrades"))
      expect(screen.getByTestId("mow-total-gold")).toBeInTheDocument()
    })
  })

  it("offers only rarity and stars in Custom", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought", {
      player: { mows: [ownedGalatian] },
    })
    fireEvent.click(screen.getByTestId("unit-values-custom"))
    expect(
      within(screen.getByTestId("unit-values")).getAllByRole("combobox")
    ).toHaveLength(1)
  })

  it("starts an unowned MoW at Common with shard progress", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought", {
      player: {
        mows: [],
        "inventory-shards": [
          { unitId: "ultraDreadnought", amount: 12, mythicAmount: 0 },
        ],
      },
    })
    expect(screen.getByTestId("unit-not-unlocked")).toHaveTextContent(
      "Not unlocked. Values start at Common."
    )
    expect(screen.getByTestId("unit-shard-progress")).toHaveAttribute(
      "aria-valuemax",
      "40"
    )
    expect(screen.getByTestId("unit-values-base")).toHaveTextContent("Starting")
  })

  it("shows the sign-in banner signed out", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    expect(screen.getByTestId("unit-showing-starting")).toHaveTextContent(
      "Showing Common, abilities level 1."
    )
    expect(screen.getByTestId("unit-sign-in-banner")).toBeInTheDocument()
  })

  it("holds the banner and state lines while a signed-in player's roster is still read", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought", {
      player: "pending",
    })
    expect(screen.getByTestId("unit-header")).toBeInTheDocument()
    expect(screen.queryByTestId("unit-sign-in-banner")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("unit-showing-starting")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("unit-not-unlocked")).not.toBeInTheDocument()
  })

  it("keeps the power loading while a signed-in player's record is still read", async () => {
    await renderUnit("/library/machines-of-war/ultraDreadnought", {
      player: "pending",
    })
    // Not the starting values' power, shown as ready before the player's own arrive.
    expect(env.power.status).toBe("ready")
    expect(screen.getByTestId("unit-power-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("unit-power-value")).not.toBeInTheDocument()
  })

  it("on mobile, shows Primary expanded and Secondary collapsed with their levels", async () => {
    env.isMobile = true
    await renderUnit("/library/machines-of-war/ultraDreadnought", {
      player: { mows: [ownedGalatian] },
    })
    const primary = screen.getByTestId("unit-section-primary")
    const secondary = screen.getByTestId("unit-section-secondary")
    expect(primary).toHaveAttribute("data-state", "open")
    expect(secondary).toHaveAttribute("data-state", "closed")
    expect(primary).toHaveTextContent("Lv 30")
    expect(secondary).toHaveTextContent("Lv 28")
  })

  describe("Mythic panel", () => {
    const owned = (progressionIndex: string) => ({
      player: { mows: [{ ...ownedGalatian, progressionIndex }] },
    })

    it("follows the blue stars, without a stepper, and shows the table value unscaled", async () => {
      await renderUnit(
        "/library/machines-of-war/ultraDreadnought",
        owned("Mythic:TwoBlueStars")
      )
      const panel = screen.getByTestId("unit-ability-mythic")
      expect(panel).toHaveTextContent("Wisdom of the Ancients")
      expect(screen.getByTestId("unit-ability-mythic-level")).toHaveTextContent(
        "Level 2 · from blue stars"
      )
      // Level 2 of 10/13/16/20; the Mythic rarity factor would make it -26%.
      expect(panel).toHaveTextContent("-13% Damage")
      expect(panel).not.toHaveTextContent("-26%")
      expect(
        screen.queryByTestId("unit-ability-mythic-missing-text")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("unit-ability-mythic-stepper")
      ).not.toBeInTheDocument()
    })

    it("is titled Mythic ability with the missing-text note when the catalog names none", async () => {
      await renderUnit("/library/machines-of-war/ultraDreadnought", {
        ...owned("Mythic:TwoBlueStars"),
        catalog: { galatianMythic: false },
      })
      expect(screen.getByTestId("unit-ability-mythic")).toHaveTextContent(
        "Mythic ability"
      )
      expect(
        screen.getByTestId("unit-ability-mythic-missing-text")
      ).toHaveTextContent("Rules text isn't in the planner yet.")
      expect(
        screen.queryByTestId("unit-ability-mythic-stepper")
      ).not.toBeInTheDocument()
    })

    it("shows the ability's name with the missing-text note when its rules text is missing", async () => {
      env.abilityText = {}
      await renderUnit(
        "/library/machines-of-war/ultraDreadnought",
        owned("Mythic:TwoBlueStars")
      )
      expect(screen.getByTestId("unit-ability-mythic")).toHaveTextContent(
        "Wisdom of the Ancients"
      )
      expect(
        screen.getByTestId("unit-ability-mythic-missing-text")
      ).toBeInTheDocument()
    })

    it("says it unlocks at Mythic below Mythic", async () => {
      await renderUnit(
        "/library/machines-of-war/ultraDreadnought",
        owned("Legendary:RedThreeStars")
      )
      expect(
        screen.getByTestId("unit-ability-mythic-locked")
      ).toHaveTextContent("Unlocks at Mythic")
      expect(
        screen.queryByTestId("unit-ability-mythic-level")
      ).not.toBeInTheDocument()
    })

    it("changes its level with Custom stars", async () => {
      await renderUnit(
        "/library/machines-of-war/ultraDreadnought",
        owned("Mythic:TwoBlueStars")
      )
      fireEvent.click(screen.getByTestId("unit-values-custom"))
      fireEvent.click(
        within(screen.getByTestId("unit-values")).getByRole("combobox")
      )
      fireEvent.click(await screen.findByRole("option", { name: /Wings/ }))
      expect(screen.getByTestId("unit-ability-mythic-level")).toHaveTextContent(
        "Level 4"
      )
      expect(screen.getByTestId("unit-ability-mythic")).toHaveTextContent(
        "-20% Damage"
      )
    })

    it("shows the catalog's mythic ability by name", async () => {
      await renderUnit("/library/machines-of-war/tyranBiovore")
      expect(screen.getByTestId("unit-ability-mythic")).toHaveTextContent(
        "Hyper Corrosive Acid"
      )
    })

    it("is a collapsed section on mobile with its level in the header", async () => {
      env.isMobile = true
      await renderUnit(
        "/library/machines-of-war/ultraDreadnought",
        owned("Legendary:RedThreeStars")
      )
      const section = screen.getByTestId("unit-section-mythic")
      expect(section).toHaveAttribute("data-state", "closed")
      expect(section).toHaveTextContent("Unlocks at Mythic")
    })
  })

  describe("Ability upgrades", () => {
    it("totals the worked example and lists each step", async () => {
      await renderUnit("/library/machines-of-war/ultraDreadnought?tab=upgrades")
      await pick("mow-range-primary-to", "3")
      await pick("mow-range-secondary-to", "2")

      expect(total("gold")).toBe("60")
      expect(total("salvage")).toBe("15")
      expect(total("components")).toBe("3")
      expect(total("badges-Common")).toBe("3")
      expect(screen.getByTestId("mow-total-badges-Common")).toHaveTextContent(
        "Common Imperial badges"
      )
      expect(
        within(screen.getByTestId("mow-material-upgHpC002")).getByText("2")
      ).toBeInTheDocument()
      expect(
        within(screen.getByTestId("mow-steps-primary")).getAllByRole("row")
      ).toHaveLength(3)
      expect(
        within(screen.getByTestId("mow-steps-primary")).getByRole("rowheader", {
          name: "1 → 2",
        })
      ).toBeInTheDocument()
    })

    it("keeps To at or above From", async () => {
      await renderUnit("/library/machines-of-war/ultraDreadnought?tab=upgrades")
      await pick("mow-range-primary-from", "30")
      expect(screen.getByTestId("mow-range-primary-to")).toHaveTextContent("30")
      fireEvent.click(screen.getByTestId("mow-range-primary-to"))
      const options = screen.getAllByRole("option").map((o) => o.textContent)
      expect(options[0]).toBe("30")
      expect(options).not.toContain("29")
    })

    it("starts an owned MoW at its levels and subtracts the inventory", async () => {
      await renderUnit(
        "/library/machines-of-war/ultraDreadnought?tab=upgrades",
        {
          player: {
            mows: [ownedGalatian],
            inventory,
            "inventory-upgrades": [{ upgradeId: "upgHpC002", amount: 1 }],
          },
        }
      )

      expect(screen.getByTestId("mow-range-primary-from")).toHaveTextContent(
        "30"
      )
      expect(screen.getByTestId("mow-range-primary-to")).toHaveTextContent("40")
      expect(screen.getByTestId("mow-range-secondary-to")).toHaveTextContent(
        "38"
      )
      // 20 steps × 1 Common badge, less the 2 owned; 20 components less 5 owned.
      const toggle = screen.getByRole("switch", {
        name: "Include owned materials",
      })
      expect(toggle).toBeChecked()
      expect(total("badges-Common")).toBe("18")
      expect(total("components")).toBe("15")
      expect(total("gold")).toBe("2,000")

      fireEvent.click(toggle)
      expect(toggle).not.toBeChecked()
      expect(total("badges-Common")).toBe("20")
      expect(total("components")).toBe("20")
      expect(total("gold")).toBe("2,000")
    })

    it("hides Include owned materials signed out", async () => {
      await renderUnit("/library/machines-of-war/ultraDreadnought?tab=upgrades")
      expect(screen.queryByTestId("mow-include-owned")).not.toBeInTheDocument()
      expect(screen.getByTestId("mow-range-primary-from")).toHaveTextContent(
        "1"
      )
    })
  })

  describe("page tour", () => {
    const targetsPresent = (steps: { target: unknown }[] | undefined) => {
      expect(steps?.length).toBeGreaterThan(0)
      for (const step of steps ?? []) {
        expect(
          document.querySelector(step.target as string),
          String(step.target)
        ).not.toBeNull()
      }
    }

    it("covers the header, tabs, Primary panel and the upgrades tab on desktop, for a MoW with rules text", async () => {
      await renderUnit("/library/machines-of-war/ultraDreadnought")
      targetsPresent(env.tour?.desktop)
      expect(env.tour?.desktop.map((step) => step.target)).toEqual([
        '[data-testid="unit-header"]',
        '[data-testid="unit-tabs"]',
        '[data-testid="unit-ability-primary"]',
        '[data-testid="unit-tab-upgrades"]',
      ])
    })

    it("targets the Primary section header on mobile", async () => {
      env.isMobile = true
      await renderUnit("/library/machines-of-war/ultraDreadnought")
      targetsPresent(env.tour?.mobile)
      expect(env.tour?.mobile?.map((step) => step.target)).toContain(
        '[data-testid="unit-section-primary"]'
      )
    })

    it("covers the ranges and totals while Ability upgrades is open", async () => {
      for (const isMobile of [false, true]) {
        env.isMobile = isMobile
        await renderUnit(
          "/library/machines-of-war/ultraDreadnought?tab=upgrades"
        )
        const steps = isMobile ? env.tour?.mobile : env.tour?.desktop
        targetsPresent(steps)
        expect(steps?.map((step) => step.target)).toEqual(
          expect.arrayContaining([
            '[data-testid="mow-upgrades-ranges"]',
            '[data-testid="mow-upgrades-totals"]',
          ])
        )
        cleanup()
      }
    })
  })
})
