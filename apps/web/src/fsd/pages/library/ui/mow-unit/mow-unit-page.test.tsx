import { useEffect, useState } from "react"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { i18n as I18n } from "i18next"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import type { ReadState } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"
import { createTestI18n } from "@/test/i18n"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import enAbilities from "../../../../../../public/locales/en/abilities.json"
import enLibrary from "../../../../../../public/locales/en/library.json"
import enMows from "../../../../../../public/locales/en/mows.json"
import enNpcAbilityText from "../../../../../../public/locales/en/npcAbilityText.json"
import enProgression from "../../../../../../public/locales/en/progression.json"
import enUpgrades from "../../../../../../public/locales/en/upgrades.json"

const env = vi.hoisted(() => ({
  tour: undefined as
    | { desktop: { target: unknown }[]; mobile?: { target: unknown }[] }
    | undefined,
  isMobile: false,
  authenticated: false,
  roster: undefined as unknown[] | undefined,
  rosterPending: false,
  costsSynced: true,
  shards: undefined as { amount: number } | undefined,
  inventory: undefined as unknown,
  inventoryUpgrades: undefined as unknown[] | undefined,
  abilityText: {} as Record<string, unknown>,
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
vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => env.authenticated,
  useMsal: () => ({ instance: { loginRedirect: vi.fn() } }),
}))
vi.mock("@/shared/unit-power", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUnitPowerContext: () => env.power,
}))
vi.mock("@/shared/ability-text", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAbilityText: () => (id: string) => env.abilityText[id],
}))

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
}
const biovore = {
  ...galatian,
  id: "tyranBiovore",
  name: "Biovore",
  faction: "Tyranids",
  alliance: "Xenos",
  primaryAbility: { ...galatian.primaryAbility, name: "SporeMine" },
  secondaryAbility: { ...galatian.secondaryAbility, name: "Biomorph" },
  // As the catalog will serve it once #204 lands.
  mythicAbility: { name: "HyperCorrosiveAcid" },
}

// Rungs 2 and 3 are the catalog's; the rest only have to exist up to level 60.
const costs = Array.from({ length: 59 }, (_, index) => {
  const level = index + 2
  return {
    id: level,
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

vi.mock("@workspace/game-catalog/queries", () => ({
  getMows: () => Promise.resolve([galatian, biovore]),
  getMowUpgradeCosts: () => Promise.resolve(costs),
  getUpgrades: () =>
    Promise.resolve(
      [
        "upgHpC002",
        "upgDmgC001",
        "upgArmC001",
        "upgHpC014",
        "upgDmgC012",
        "upgArmC013",
        "upgDmgC013",
      ].map(upgrade)
    ),
  getUnlockShardCostsMap: () =>
    Promise.resolve(
      new Map([["Common", { id: "Common", rarity: "Common", shards: 40 }]])
    ),
}))
vi.mock("@workspace/game-catalog", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getGameCatalogMetadata: () =>
    Promise.resolve(
      new Map([
        ["mows", {}],
        ...(env.costsSynced ? [["mow-upgrade-costs", {}] as const] : []),
      ])
    ),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerMows: () =>
    env.rosterPending
      ? new Promise<never>(() => {})
      : Promise.resolve(env.roster),
  getPlayerMow: (id: string) =>
    Promise.resolve(
      env.roster?.find((unit) => (unit as { unitId: string }).unitId === id)
    ),
  getInventoryShard: () => Promise.resolve(env.shards),
  getInventoryAbilityMaterials: () => Promise.resolve(env.inventory),
  getInventoryUpgrades: () => Promise.resolve(env.inventoryUpgrades),
}))

import { MowUnitPage } from "./mow-unit-page"

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

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", {
    en: {
      library: enLibrary,
      abilities: enAbilities,
      mows: enMows,
      progression: enProgression,
      upgrades: enUpgrades,
      npcAbilityText: enNpcAbilityText,
    },
  })
})

function Where() {
  const location = useLocation()
  return (
    <output data-testid="where">
      {location.pathname}
      {location.search}
    </output>
  )
}

async function renderUnit(url: string) {
  render(
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[url]}>
          <Routes>
            <Route
              path="/library/machines-of-war/:entityId"
              element={
                <>
                  <MowUnitPage />
                  <Where />
                </>
              }
            />
            <Route
              path="/library/machines-of-war"
              element={<p data-testid="list-route">list</p>}
            />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </I18nextProvider>
  )
  await act(async () => {})
  await act(async () => {})
}

const total = (key: string) =>
  within(screen.getByTestId(`mow-total-${key}`)).getByRole("definition")
    .textContent

async function pick(trigger: string, option: string) {
  fireEvent.click(screen.getByTestId(trigger))
  fireEvent.click(await screen.findByRole("option", { name: option }))
}

describe("MowUnitPage", () => {
  beforeEach(() => {
    env.isMobile = false
    env.authenticated = false
    env.roster = undefined
    env.rosterPending = false
    env.costsSynced = true
    env.shards = undefined
    env.inventory = undefined
    env.inventoryUpgrades = undefined
    env.abilityText = {}
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
    env.costsSynced = false
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    expect(screen.getByTestId("mow-unit-loading")).toBeInTheDocument()
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
    // Imperial before Xenos: Galatian, then Biovore.
    fireEvent.click(screen.getByRole("link", { name: /Next unit: Biovore/ }))
    await act(async () => {})
    expect(screen.getByTestId("where")).toHaveTextContent(
      "/library/machines-of-war/tyranBiovore?tab=upgrades"
    )
  })

  it("shows both abilities without rules text in the missing-text state", async () => {
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

  it("turns the panel on when rules text exists, up to the ladder's top level", async () => {
    env.abilityText = {
      DutyEternal: (enNpcAbilityText as Record<string, unknown>).StormOfWrath,
    }
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    expect(
      screen.getByTestId("unit-ability-primary-stepper")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("unit-ability-secondary-missing-text")
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByTestId("unit-ability-primary-chart-minDmg-column-59")
    )
    expect(
      screen.getByTestId("unit-ability-primary-stepper-value")
    ).toHaveTextContent("Lv 60")
  })

  it("opens an owned MoW at the player's values, with no rank", async () => {
    env.authenticated = true
    env.roster = [ownedGalatian]
    await renderUnit("/library/machines-of-war/ultraDreadnought")
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
      env.authenticated = true
      env.roster = [maxedBiovore]
      await renderUnit("/library/machines-of-war/tyranBiovore")
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

    it("shows the power as unavailable and keeps the panels and tabs when the data failed", async () => {
      env.power = { status: "error", retry: () => {} }
      env.authenticated = true
      env.roster = [maxedBiovore]
      await renderUnit("/library/machines-of-war/tyranBiovore")
      expect(screen.getByTestId("unit-power-value")).toHaveTextContent("—")
      expect(screen.getByTestId("unit-power-note")).toHaveTextContent(
        "Power data unavailable"
      )
      expect(screen.getByTestId("unit-ability-primary")).toBeInTheDocument()
      expect(screen.getByTestId("unit-ability-secondary")).toBeInTheDocument()
      fireEvent.click(screen.getByTestId("unit-tab-upgrades"))
      expect(screen.getByTestId("mow-total-gold")).toBeInTheDocument()
    })
  })

  it("offers only rarity and stars in Custom", async () => {
    env.authenticated = true
    env.roster = [ownedGalatian]
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    fireEvent.click(screen.getByTestId("unit-values-custom"))
    expect(
      within(screen.getByTestId("unit-values")).getAllByRole("combobox")
    ).toHaveLength(1)
  })

  it("starts an unowned MoW at Common with shard progress", async () => {
    env.authenticated = true
    env.roster = []
    env.shards = { amount: 12 }
    await renderUnit("/library/machines-of-war/ultraDreadnought")
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
    env.authenticated = true
    env.rosterPending = true
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    expect(screen.getByTestId("unit-header")).toBeInTheDocument()
    expect(screen.queryByTestId("unit-sign-in-banner")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("unit-showing-starting")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("unit-not-unlocked")).not.toBeInTheDocument()
  })

  it("on mobile, shows Primary expanded and Secondary collapsed with their levels", async () => {
    env.isMobile = true
    env.authenticated = true
    env.roster = [ownedGalatian]
    await renderUnit("/library/machines-of-war/ultraDreadnought")
    const primary = screen.getByTestId("unit-section-primary")
    const secondary = screen.getByTestId("unit-section-secondary")
    expect(primary).toHaveAttribute("data-state", "open")
    expect(secondary).toHaveAttribute("data-state", "closed")
    expect(primary).toHaveTextContent("Lv 30")
    expect(secondary).toHaveTextContent("Lv 28")
  })

  describe("Mythic panel", () => {
    const owned = (progressionIndex: string) => {
      env.authenticated = true
      env.roster = [{ ...ownedGalatian, progressionIndex }]
    }

    it("follows the blue stars, without a stepper, and has no data yet", async () => {
      owned("Mythic:TwoBlueStars")
      await renderUnit("/library/machines-of-war/ultraDreadnought")
      const panel = screen.getByTestId("unit-ability-mythic")
      expect(panel).toHaveTextContent("Mythic ability")
      expect(screen.getByTestId("unit-ability-mythic-level")).toHaveTextContent(
        "Level 2 · from blue stars"
      )
      expect(
        screen.getByTestId("unit-ability-mythic-missing-text")
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId("unit-ability-mythic-stepper")
      ).not.toBeInTheDocument()
    })

    it("says it unlocks at Mythic below Mythic", async () => {
      owned("Legendary:RedThreeStars")
      await renderUnit("/library/machines-of-war/ultraDreadnought")
      expect(
        screen.getByTestId("unit-ability-mythic-locked")
      ).toHaveTextContent("Unlocks at Mythic")
      expect(
        screen.queryByTestId("unit-ability-mythic-level")
      ).not.toBeInTheDocument()
    })

    it("changes its level with Custom stars", async () => {
      owned("Mythic:TwoBlueStars")
      await renderUnit("/library/machines-of-war/ultraDreadnought")
      fireEvent.click(screen.getByTestId("unit-values-custom"))
      fireEvent.click(
        within(screen.getByTestId("unit-values")).getByRole("combobox")
      )
      fireEvent.click(await screen.findByRole("option", { name: /Wings/ }))
      expect(screen.getByTestId("unit-ability-mythic-level")).toHaveTextContent(
        "Level 4"
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
      owned("Legendary:RedThreeStars")
      await renderUnit("/library/machines-of-war/ultraDreadnought")
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
      env.authenticated = true
      env.roster = [ownedGalatian]
      env.inventory = inventory
      env.inventoryUpgrades = [{ upgradeId: "upgHpC002", amount: 1 }]
      await renderUnit("/library/machines-of-war/ultraDreadnought?tab=upgrades")

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

    it("covers the header, tabs, Primary panel and the upgrades tab on desktop, for a MoW without rules text", async () => {
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
