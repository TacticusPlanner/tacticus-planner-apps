import { useEffect, useState } from "react"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { i18n as I18n } from "i18next"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n } from "@/test/i18n"

import enAbilities from "../../../../../../public/locales/en/abilities.json"
import enEquipment from "../../../../../../public/locales/en/equipment.json"
import enLibrary from "../../../../../../public/locales/en/library.json"
import enMythicQuests from "../../../../../../public/locales/en/mythicQuests.json"
import enMythicQuestTasks from "../../../../../../public/locales/en/mythicQuestTasks.json"
import enNpcAbilityText from "../../../../../../public/locales/en/npcAbilityText.json"
import enNpcTraitText from "../../../../../../public/locales/en/npcTraitText.json"
import enProgression from "../../../../../../public/locales/en/progression.json"

const env = vi.hoisted(() => ({
  tour: undefined as
    | { desktop: { target: unknown }[]; mobile?: { target: unknown }[] }
    | undefined,
  isMobile: false,
  authenticated: false,
  roster: undefined as unknown[] | undefined,
  shards: undefined as { amount: number } | undefined,
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
// The calculator tab has its own tests; here it only has to be the thing the tab shows.
vi.mock("../character/character-rank-up-tab", () => ({
  CharacterRankUpTab: ({ characterId }: { characterId: string }) => (
    <p data-testid="rank-up-tab">{characterId}</p>
  ),
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

const tigurius = {
  id: "ultraTigurius",
  name: "Tigurius",
  faction: "Ultramarines",
  alliance: "Imperial",
  health: 65,
  damage: 30,
  armour: 14,
  initialRarity: "Uncommon",
  meleeDamage: "Physical",
  meleeHits: 1,
  rangedDamage: "Psychic",
  rangedHits: 1,
  rangeDistance: 2,
  movement: 3,
  traits: ["Psyker"],
  activeAbilityNames: ["StormOfWrath"],
  passiveAbilityNames: ["PsychicFortress"],
  equipmentSlots: ["I_Crit", "I_Defensive", "I_Booster_Crit"],
}
const lhykhis = {
  id: "eldarLhykhis",
  name: "Lhykhis",
  faction: "Aeldari",
  alliance: "Xenos",
  health: 75,
  damage: 12,
  armour: 22,
  initialRarity: "Legendary",
  meleeDamage: "Gauss",
  meleeHits: 5,
  rangedDamage: "Eviscerate",
  rangedHits: 5,
  rangeDistance: 2,
  movement: 4,
  traits: ["Infiltrate", "Flying"],
  activeAbilityNames: ["EmpyricAmbush"],
  passiveAbilityNames: ["WhisperingWeb"],
  equipmentSlots: ["I_Crit", "I_Block", "I_Booster_Crit"],
}
const calgar = {
  ...tigurius,
  id: "ultraCalgar",
  name: "Calgar",
  health: 80,
  rangedDamage: null,
  rangedHits: null,
  rangeDistance: null,
  activeAbilityNames: ["NotInTheText"],
  passiveAbilityNames: ["AlsoNotInTheText"],
}
const relic = {
  id: "R_Tigurius",
  name: "Psychic Hood",
  rarity: "Mythic",
  type: "I_Defensive",
  abilityId: "NotARelicText",
  isRelic: true,
  isUniqueRelic: true,
  allowedUnits: ["ultraTigurius"],
  allowedFactions: [],
  levels: [],
  upgradeLevels: [],
}
const sharedRelic = {
  ...relic,
  id: "R_Shared",
  name: "Shared Banner",
  isUniqueRelic: false,
  allowedUnits: ["ultraCalgar", "ultraTigurius"],
}

const critItems = [
  {
    ...relic,
    id: "I_Crit_M001",
    name: "Master Blade",
    rarity: "Mythic",
    type: "I_Crit",
    isRelic: false,
    isUniqueRelic: false,
    allowedUnits: [],
    allowedFactions: [],
    levels: [
      { stats: { critChance: 20, critDamage: 1835 } },
      { stats: { critChance: 20, critDamage: 2727 } },
    ],
  },
  {
    ...relic,
    id: "I_Crit_C001",
    name: "Combat Knife",
    rarity: "Common",
    type: "I_Crit",
    isRelic: false,
    isUniqueRelic: false,
    allowedUnits: [],
    allowedFactions: ["Ultramarines"],
  },
  {
    ...relic,
    id: "I_Crit_C002",
    name: "Choppa",
    rarity: "Common",
    type: "I_Crit",
    isRelic: false,
    isUniqueRelic: false,
    allowedUnits: [],
    allowedFactions: ["Orks"],
  },
  {
    ...relic,
    id: "I_Crit_C005",
    name: "_I_Crit_C005",
    rarity: "Common",
    type: "I_Crit",
    isRelic: false,
    isUniqueRelic: false,
    allowedUnits: [],
    allowedFactions: [],
  },
]

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharacters: () => Promise.resolve([tigurius, lhykhis, calgar]),
  getEquipment: () => Promise.resolve([relic, sharedRelic, ...critItems]),
  getUnlockShardCostsMap: () =>
    Promise.resolve(
      new Map([
        ["Uncommon", { id: "Uncommon", rarity: "Uncommon", shards: 80 }],
        ["Legendary", { id: "Legendary", rarity: "Legendary", shards: 500 }],
      ])
    ),
}))
vi.mock("@workspace/game-catalog", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getGameCatalogMetadata: () => Promise.resolve(new Map([["characters", {}]])),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: () => Promise.resolve(env.roster),
  getPlayerCharacter: (id: string) =>
    Promise.resolve(
      env.roster?.find((unit) => (unit as { unitId: string }).unitId === id)
    ),
  getInventoryShard: () => Promise.resolve(env.shards),
}))

import { CharacterUnitPage } from "./character-unit-page"

const ownedTigurius = {
  unitId: "ultraTigurius",
  progressionIndex: "Mythic:TwoBlueStars",
  rank: "Adamantine2",
  xp: 0,
  xpLevel: 50,
  shards: 0,
  mythicShards: 0,
  abilities: [
    { abilityId: "StormOfWrath", level: 58 },
    { abilityId: "PsychicFortress", level: 46 },
  ],
  appliedUpgradeSlots: [],
  equippedItems: [{ slotId: "relic", equipmentId: "R_Tigurius", level: 3 }],
}

let i18n: I18n
beforeAll(async () => {
  i18n = await createTestI18n("en", {
    en: {
      library: enLibrary,
      abilities: enAbilities,
      equipment: enEquipment,
      progression: enProgression,
      npcAbilityText: enNpcAbilityText,
      npcTraitText: enNpcTraitText,
      mythicQuests: enMythicQuests,
      mythicQuestTasks: enMythicQuestTasks,
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
              path="/library/characters/:entityId"
              element={
                <>
                  <CharacterUnitPage />
                  <Where />
                </>
              }
            />
            <Route
              path="/library/characters"
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

describe("CharacterUnitPage", () => {
  beforeEach(() => {
    env.isMobile = false
    env.authenticated = false
    env.roster = undefined
    env.shards = undefined
  })

  it("shows the not-found state for an id that isn't a character", async () => {
    await renderUnit("/library/characters/notACharacter")
    expect(screen.getByTestId("character-unit-not-found")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Characters" })).toHaveAttribute(
      "href",
      "/library/characters"
    )
  })

  it("opens an owned unit at the player's values", async () => {
    env.authenticated = true
    env.roster = [ownedTigurius]
    await renderUnit("/library/characters/ultraTigurius")

    expect(screen.getByTestId("unit-your-line")).toHaveTextContent(
      "Your unit: Mythic · Two Blue Stars · Adamantine II · abilities 58 / 46 · relic level 3"
    )
    expect(
      within(screen.getByTestId("unit-glance-health")).getByText("8,032")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("unit-ability-active-stepper-value")
    ).toHaveTextContent("Lv 58")
    expect(
      screen.getByTestId("unit-ability-passive-stepper-value")
    ).toHaveTextContent("Lv 46")
    expect(screen.getByTestId("unit-values-base")).toHaveTextContent(
      "Your unit"
    )
  })

  it("starts a unit the player doesn't own at its starting values, with shard progress", async () => {
    env.authenticated = true
    env.roster = []
    env.shards = { amount: 30 }
    await renderUnit("/library/characters/ultraTigurius")

    expect(screen.getByTestId("unit-portrait")).toHaveAttribute(
      "data-greyed",
      "true"
    )
    expect(screen.getByTestId("unit-not-unlocked")).toHaveTextContent(
      "Not unlocked. Values start at Uncommon, Two Stars, Stone I."
    )
    const progress = screen.getByRole("progressbar", {
      name: "Shards towards unlocking",
    })
    expect(progress).toHaveAttribute("aria-valuenow", "30")
    expect(progress).toHaveAttribute("aria-valuemax", "80")
    expect(screen.getByText("30 / 80 shards")).toBeInTheDocument()
    expect(screen.getByTestId("unit-values-base")).toHaveTextContent("Starting")
  })

  it("changes the stats with Custom values but not the radar, and restores the player's values", async () => {
    env.authenticated = true
    env.roster = [ownedTigurius]
    await renderUnit("/library/characters/ultraTigurius")
    const radarHealth = screen.getByTestId("unit-radar-health").textContent

    fireEvent.click(screen.getByTestId("unit-values-custom"))
    const [, rankSelect] = within(
      screen.getByTestId("unit-values")
    ).getAllByRole("combobox")
    fireEvent.click(rankSelect)
    fireEvent.click(screen.getByRole("option", { name: /Diamond I$/ }))

    // Diamond I is below Adamantine II, so Health drops from 8,032.
    expect(
      within(screen.getByTestId("unit-glance-health")).queryByText("8,032")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("unit-radar-health").textContent).toBe(
      radarHealth
    )

    fireEvent.click(screen.getByTestId("unit-values-base"))
    expect(
      within(screen.getByTestId("unit-glance-health")).getByText("8,032")
    ).toBeInTheDocument()
  })

  it("offers sign-in to a signed-out visitor and shows the starting values", async () => {
    await renderUnit("/library/characters/ultraTigurius")

    expect(screen.getByTestId("unit-portrait")).not.toHaveAttribute(
      "data-greyed"
    )
    expect(screen.getByTestId("unit-showing-starting")).toHaveTextContent(
      "Showing Uncommon, Two Stars, Stone I, abilities level 1."
    )
    expect(
      within(screen.getByTestId("unit-sign-in-banner")).getByRole("button", {
        name: "Sign in",
      })
    ).toBeInTheDocument()
  })

  it("points a signed-in visitor without a synced roster at Sync with Tacticus", async () => {
    env.authenticated = true
    env.roster = undefined
    await renderUnit("/library/characters/ultraTigurius")
    expect(screen.getByTestId("unit-sign-in-banner")).toHaveTextContent(
      "Sync with Tacticus"
    )
  })

  it("shows the missing-text state for both abilities of a character without rules text", async () => {
    await renderUnit("/library/characters/eldarLhykhis")
    expect(
      screen.getByTestId("unit-ability-active-missing-text")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("unit-ability-passive-missing-text")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("unit-ability-active-stepper")
    ).not.toBeInTheDocument()
  })

  it("shows a relic panel only for a character a relic can be equipped on", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    expect(screen.getByTestId("unit-relic")).toHaveTextContent("Psychic Hood")
    expect(screen.getByTestId("unit-relic-missing-text")).toBeInTheDocument()
  })

  it("marks the equipment slot the relic goes in", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    expect(
      screen.getByTestId("unit-glance-slot-I_Defensive-relic")
    ).toHaveTextContent("Relic: Psychic Hood")
    expect(screen.getByTestId("unit-glance-slot-I_Crit")).not.toHaveTextContent(
      "Relic"
    )
  })

  it("opens a slot's equippable items, grouped by rarity from highest, without other factions' or unnamed items", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    const crit = screen.getByTestId("unit-glance-slot-I_Crit-toggle")
    expect(crit).toHaveTextContent("2 items")
    expect(crit).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(crit)
    expect(crit).toHaveAttribute("aria-expanded", "true")
    const list = screen.getByTestId("unit-glance-items")
    expect(list).toHaveTextContent(
      /Mythic\s*Master Blade.*Common\s*Combat Knife/
    )
    expect(list).not.toHaveTextContent("Choppa")
    expect(list).not.toHaveTextContent("_I_Crit_C005")
    fireEvent.click(crit)
    expect(screen.queryByTestId("unit-glance-items")).not.toBeInTheDocument()
  })

  it("shows an item's stats from level 1 to its last level on focus", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    fireEvent.click(screen.getByTestId("unit-glance-slot-I_Crit-toggle"))
    fireEvent.focus(screen.getByTestId("unit-item-I_Crit_M001"))
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Master Blade · Mythic")
    expect(tooltip).toHaveTextContent("Crit chance +20%")
    expect(tooltip).toHaveTextContent("Crit damage +1,835 → +2,727")
    expect(tooltip).toHaveTextContent("Level 1 → 2")
  })

  it("jumps to the relic panel from the relic in its slot", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    fireEvent.click(screen.getByTestId("unit-glance-slot-I_Defensive-relic"))
    await waitFor(() =>
      expect(document.activeElement).toContainElement(
        screen.getByTestId("unit-relic")
      )
    )
  })

  it("marks no slot for a character without a relic", async () => {
    await renderUnit("/library/characters/eldarLhykhis")
    expect(screen.getByTestId("unit-glance")).not.toHaveTextContent("Relic:")
  })

  it("labels a unique relic, with no list of other characters", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    expect(screen.getByTestId("unit-relic")).toHaveTextContent("Unique relic")
    expect(screen.queryByTestId("unit-relic-note")).not.toBeInTheDocument()
  })

  it("labels a shared relic and names the other characters who can equip it", async () => {
    await renderUnit("/library/characters/ultraCalgar")
    expect(screen.getByTestId("unit-relic")).toHaveTextContent("Shared relic")
    expect(screen.getByTestId("unit-relic-note")).toHaveTextContent(
      /^Also equippable by Tigurius$/
    )
  })

  it("lists a character's mythic quests with their tasks and rewards", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    const card = screen.getByTestId("unit-mythic")
    expect(card).toHaveTextContent("Mythic quests")
    expect(card).toHaveTextContent("5 quests")
    const first = within(screen.getByTestId("unit-mythic-quest-1"))
    expect(first.getAllByRole("listitem").length).toBeGreaterThan(0)
    expect(first.getByText(/Tigurius mythic shards/)).toBeInTheDocument()
  })

  it("has no mythic quest card for a character without quest data", async () => {
    // Every fixture character has quests in the ported data; drop Calgar's for this case.
    const bundle = i18n.getResourceBundle("en", "mythicQuests") as Record<
      string,
      unknown
    >
    const calgarQuests = bundle.ultraCalgar
    delete bundle.ultraCalgar
    try {
      await renderUnit("/library/characters/ultraCalgar")
      expect(screen.getByTestId("unit-details")).toBeInTheDocument()
      expect(screen.queryByTestId("unit-mythic")).not.toBeInTheDocument()
    } finally {
      bundle.ultraCalgar = calgarQuests
    }
  })

  it("shows each headline stat with its stat icon", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    for (const [key, file] of [
      ["health", "ui_icon_stat_health_01.png"],
      ["damage", "ui_icon_stat_dmg_01.png"],
      ["armour", "ui_icon_stat_armor_01.png"],
      ["movement", "ui_icon_stat_move_01.png"],
    ]) {
      const icon = screen.getByTestId(`unit-glance-${key}`).querySelector("img")
      expect(icon?.getAttribute("src"), key).toContain(file)
    }
  })

  it("shows each attack's hits, damage type with its pierce, and range", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    const melee = screen.getByTestId("unit-attack-melee")
    expect(melee).toHaveTextContent("1 hit")
    expect(melee).toHaveTextContent("Physical")
    expect(screen.getByTestId("unit-attack-melee-pierce")).toHaveTextContent(
      "1% pierce ratio"
    )
    const ranged = screen.getByTestId("unit-attack-ranged")
    expect(ranged).toHaveTextContent("Psychic")
    expect(ranged).toHaveTextContent("Range 2")
    expect(screen.getByTestId("unit-attack-ranged-pierce")).toHaveTextContent(
      "100% pierce ratio"
    )
  })

  it("has no ranged attack row for a melee-only character", async () => {
    await renderUnit("/library/characters/ultraCalgar")
    expect(screen.getByTestId("unit-attack-melee")).toBeInTheDocument()
    expect(screen.queryByTestId("unit-attack-ranged")).not.toBeInTheDocument()
  })

  it("shows the relic card with a no-relic message for a character without one", async () => {
    await renderUnit("/library/characters/eldarLhykhis")
    expect(screen.getByTestId("unit-relic")).toHaveTextContent("Relic")
    expect(screen.getByTestId("unit-relic-none")).toHaveTextContent(
      "Lhykhis has no relic."
    )
  })

  it("shows the comparison radar's percentiles in the list and At a glance", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    // Of the three characters, Tigurius has the lowest Health: 0% are strictly lower.
    expect(screen.getByTestId("unit-radar-health")).toHaveTextContent("0%")
    expect(screen.getByTestId("unit-glance-health")).toHaveTextContent(
      "0th percentile"
    )
    expect(screen.getByTestId("unit-radar-median")).toBeInTheDocument()
  })

  it("explains the pierce ratio rule with the attack's own percentage", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    fireEvent.focus(screen.getByTestId("unit-attack-melee-pierce"))
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "each hit deals the higher of its damage minus the target's armour, or 1% of its damage"
    )
  })

  it("links the comparison to the wiki's damage explanation in a new tab", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    const link = screen.getByRole("link", {
      name: "How damage works (Tacticus wiki)",
    })
    expect(link).toHaveAttribute(
      "href",
      "https://tacticus.wiki.gg/wiki/HDTW_Damage"
    )
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("opens the calculator from the URL and keeps its range when switching tabs", async () => {
    await renderUnit(
      "/library/characters/ultraTigurius?tab=rankup&rankStart=Gold1"
    )
    expect(screen.getByTestId("rank-up-tab")).toHaveTextContent("ultraTigurius")

    fireEvent.click(screen.getByRole("tab", { name: "Details" }))
    expect(screen.getByTestId("where")).toHaveTextContent(
      "/library/characters/ultraTigurius?rankStart=Gold1"
    )
    expect(screen.getByTestId("unit-details")).toBeInTheDocument()
  })

  it("walks the list's default order with prev/next and keeps the tab", async () => {
    await renderUnit("/library/characters/ultraTigurius?tab=rankup")
    // Default order: Imperial Ultramarines Calgar, Tigurius; then Xenos Lhykhis.
    expect(screen.getByTestId("unit-nav-position")).toHaveTextContent("2 of 3")
    const next = screen.getByRole("link", { name: "Next unit: Lhykhis" })
    fireEvent.click(next)
    await act(async () => {})
    expect(screen.getByTestId("where")).toHaveTextContent(
      "/library/characters/eldarLhykhis?tab=rankup"
    )
    expect(screen.getByTestId("unit-nav-next")).toBeDisabled()
    expect(screen.getByTestId("unit-nav-back")).toHaveAttribute(
      "href",
      "/library/characters"
    )
  })

  it.each([
    ["desktop", false],
    ["mobile", true],
  ])(
    "targets only elements on the page in the %s tour",
    async (form, isMobile) => {
      env.isMobile = isMobile
      await renderUnit("/library/characters/ultraTigurius")
      const steps = (isMobile ? env.tour?.mobile : env.tour?.desktop) ?? []
      expect(steps.length).toBeGreaterThanOrEqual(5)
      for (const step of steps) {
        expect(
          document.querySelector(step.target as string),
          `${form}: ${String(step.target)}`
        ).not.toBeNull()
      }
    }
  )

  it("leaves the ability step out of the tour when the unit has no ability text", async () => {
    await renderUnit("/library/characters/eldarLhykhis")
    const targets = env.tour?.desktop.map((step) => step.target) ?? []
    expect(targets).not.toContain('[data-testid="unit-ability-active"]')
    for (const target of targets) {
      expect(document.querySelector(target as string)).not.toBeNull()
    }
  })

  it("on mobile, lists the sections as collapsible headers with Active open and stats as a table", async () => {
    env.isMobile = true
    await renderUnit("/library/characters/ultraTigurius")
    const active = within(screen.getByTestId("unit-section-active"))
    expect(active.getByRole("button", { expanded: true })).toBeInTheDocument()
    const stats = within(screen.getByTestId("unit-section-stats"))
    const trigger = stats.getByRole("button", { expanded: false })
    fireEvent.click(trigger)
    expect(screen.getByTestId("unit-stats-table")).toBeInTheDocument()
  })

  it("on mobile, opens the Relic section when the relic in its slot is clicked", async () => {
    env.isMobile = true
    await renderUnit("/library/characters/ultraTigurius")
    const section = within(screen.getByTestId("unit-section-relic"))
    expect(section.getByRole("button", { expanded: false })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("unit-glance-slot-I_Defensive-relic"))
    expect(
      await section.findByRole("button", { expanded: true })
    ).toBeInTheDocument()
  })

  it("on mobile, collapses the relic section with a None summary for a character without one", async () => {
    env.isMobile = true
    await renderUnit("/library/characters/eldarLhykhis")
    const relic = within(screen.getByTestId("unit-section-relic"))
    const trigger = relic.getByRole("button", { expanded: false })
    expect(trigger).toHaveTextContent("None")
  })
})
