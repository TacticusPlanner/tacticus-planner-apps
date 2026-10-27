import { useLocation } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { unitOriginState } from "@/entities/unit"
import type { ReadState } from "@/shared/lib"
import type { UnitPowerContext } from "@/shared/unit-power"
import {
  holdNamespaceLoads,
  i18n,
  requestedNamespaces,
} from "@/test/i18n-instance"
import { act, fireEvent, render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import deLibrary from "../../../../../../public/locales/de/library.json"
import mythicQuestsFixture from "../../model/mythic-quests.fixture.json"

const env = vi.hoisted(() => ({
  tour: undefined as
    | { desktop: { target: unknown }[]; mobile?: { target: unknown }[] }
    | undefined,
  isMobile: false,
  authenticated: false,
  roster: undefined as unknown[] | undefined,
  rosterPending: false,
  shards: undefined as { amount: number } | undefined,
  extraCharacters: [] as unknown[],
  extraEquipment: [] as unknown[],
  mythicQuestsSynced: true,
  mythicQuestRecords: undefined as unknown[] | undefined,
  power: {
    status: "loading",
    retry: () => {},
  },
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
// The calculator tab has its own tests; here it only has to be the thing the tab shows.
vi.mock("../character/character-rank-up-tab", () => ({
  CharacterRankUpTab: ({ characterId }: { characterId: string }) => (
    <p data-testid="rank-up-tab">{characterId}</p>
  ),
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
  // Known gaps (npcAbilityTextGaps): ids with no rules text, to exercise the missing-text state.
  activeAbilityNames: ["RunsAway"],
  passiveAbilityNames: ["RunsAround"],
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
  activeAbilityNames: ["BossEndFightUndefeated"],
  passiveAbilityNames: ["RepairEnthusiast"],
}
const relic = {
  id: "R_Tigurius",
  name: "Psychic Hood",
  rarity: "Mythic",
  type: "I_Defensive",
  abilityId: "RunsAway",
  isRelic: true,
  isUniqueRelic: true,
  allowedUnits: ["ultraTigurius"],
  allowedFactions: [],
  levels: [],
  upgradeLevels: [],
}
// Hollan and his relic, added to the catalog only by the tests that need them.
const hollan = {
  ...lhykhis,
  id: "genesBiophagus",
  name: "Hollan",
  faction: "GenestealerCults",
}
const voidwyrm = {
  ...relic,
  id: "R_Hollan",
  name: "Amulet of the Voidwyrm",
  abilityId: "AmuletOfTheVoidwyrm",
  allowedUnits: ["genesBiophagus"],
  // The served relic levels set the stepper's cap (every relic serves 10).
  levels: Array.from({ length: 10 }, () => ({ stats: {} })),
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

// Seeds the catalog (and, when signed in with a roster, the player data) through real storage.
async function seedUnitData() {
  await seedGameCatalog({
    characters: [tigurius, lhykhis, calgar, ...env.extraCharacters],
    equipment: [relic, sharedRelic, ...critItems, ...env.extraEquipment],
    // Served records for Abaddon, Calgar, Lucius and Tigurius; none when the dataset isn't synced.
    ...(env.mythicQuestsSynced
      ? {
          "mythic-quests":
            env.mythicQuestRecords ?? mythicQuestsFixture.records,
        }
      : {}),
    "unlock-shard-costs": [
      { rarity: "Uncommon", shards: 80 },
      { rarity: "Legendary", shards: 500 },
    ],
  })
  if (env.roster) {
    await seedPlayerData({ characters: env.roster })
  }
  if (env.shards) {
    await seedPlayerData({
      "inventory-shards": [
        { unitId: "ultraTigurius", mythicAmount: 0, ...env.shards },
      ],
    })
  }
}

// Holds the roster read (the player-data `characters` store's full scan) open forever.
function holdRosterRead() {
  const getAll = IDBObjectStore.prototype.getAll
  vi.spyOn(IDBObjectStore.prototype, "getAll").mockImplementation(function (
    this: IDBObjectStore,
    ...args: Parameters<IDBObjectStore["getAll"]>
  ) {
    if (
      this.name === "characters" &&
      this.transaction.db.name === "tacticus-planner-player-data"
    ) {
      return {} as IDBRequest<unknown[]>
    }
    return getAll.apply(this, args)
  })
}

import { buildUnitPowerContext, characterPowerAt } from "@/shared/unit-power"
import { unitPowerCatalog } from "@/test/fixtures/unit-power"

import { CharacterUnitPage } from "./character-unit-page"

// The real power data, plus a stand-in for the page's Tigurius relic (a relic the fixture holds,
// under the page catalog's id) so an owned unit wearing it has a power figure.
const boltPistol = unitPowerCatalog.equipment.find(
  (item) => item.id === "R_Crit_RelicBoltPistol"
)!
const powerContext = buildUnitPowerContext({
  ...unitPowerCatalog,
  equipment: [
    ...unitPowerCatalog.equipment,
    { ...boltPistol, id: "R_Tigurius" as typeof boltPistol.id },
  ],
})!
const powerReady: ReadState<UnitPowerContext | null> = {
  status: "ready",
  data: powerContext,
  retry: () => {},
}

// The spec's Gold I Tigurius: Epic 1 red star, slots 0 to 2, abilities 20/15, a Combat Knife at 3.
const goldTigurius = {
  unitId: "ultraTigurius",
  progressionIndex: "Epic:RedOneStar",
  rank: "Gold1",
  xp: 0,
  xpLevel: 30,
  shards: 0,
  mythicShards: 0,
  abilities: [
    { abilityId: "StormOfWrath", level: 20 },
    { abilityId: "PsychicFortress", level: 15 },
  ],
  appliedUpgradeSlots: [0, 1, 2],
  equippedItems: [{ slotId: "crit", equipmentId: "I_Crit_C001", level: 3 }],
}

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

function Where() {
  const location = useLocation()
  return (
    <output data-testid="where">
      {location.pathname}
      {location.search}
    </output>
  )
}

async function renderUnit(url: string, state?: unknown) {
  await seedUnitData()
  if (env.rosterPending) {
    holdRosterRead()
  }
  const [pathname, search] = url.split("?")
  const { queryClient } = render(
    <>
      <CharacterUnitPage />
      <Where />
    </>,
    {
      route: "/library/characters/:entityId",
      initialEntries: [{ pathname, search: search ? `?${search}` : "", state }],
      auth: { authenticated: env.authenticated },
    }
  )
  // The catalog, then (unless held) the player's ownership state.
  await waitFor(() =>
    expect(
      document.querySelector(
        env.rosterPending
          ? '[data-testid="unit-header"]'
          : '[data-testid="character-unit-not-found"],[data-testid="unit-your-line"],[data-testid="unit-not-unlocked"],[data-testid="unit-sign-in-banner"]'
      )
    ).not.toBeNull()
  )
  // Let the page's catalog reads (equipment, for the relic) settle before the test looks. TanStack
  // Query renders a settled read on a later timer tick, so flush one after the reads are done.
  await waitFor(() =>
    expect(queryClient.isFetching({ queryKey: ["local", "catalog"] })).toBe(0)
  )
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("CharacterUnitPage", () => {
  beforeEach(() => {
    env.isMobile = false
    env.authenticated = false
    env.roster = undefined
    env.rosterPending = false
    env.shards = undefined
    env.extraCharacters = []
    env.extraEquipment = []
    env.mythicQuestsSynced = true
    env.mythicQuestRecords = undefined
    env.power = powerReady
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
      within(screen.getByTestId("unit-glance-health")).getByText("7,955")
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
    // Power at Uncommon, 2 stars, Stone I, abilities 1/1, no slots and no items.
    const expected = characterPowerAt(
      "ultraTigurius",
      {
        rank: "Stone1",
        progression: "Uncommon:TwoStars",
        appliedUpgradeSlots: [],
        activeAbilityLevel: 1,
        passiveAbilityLevel: 1,
      },
      powerContext
    )!
    expect(screen.getByTestId("unit-power-value")).toHaveTextContent(
      expected.toLocaleString("en")
    )
    expect(screen.getByTestId("unit-power-note")).toHaveTextContent(
      "Without equipment"
    )
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
    if (!rankSelect) throw new Error("expected a rank select")
    fireEvent.click(rankSelect)
    fireEvent.click(screen.getByRole("option", { name: /Diamond I$/ }))

    // Diamond I is below Adamantine II, so Health drops from 7,955.
    expect(
      within(screen.getByTestId("unit-glance-health")).queryByText("7,955")
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("unit-radar-health").textContent).toBe(
      radarHealth
    )

    fireEvent.click(screen.getByTestId("unit-values-base"))
    expect(
      within(screen.getByTestId("unit-glance-health")).getByText("7,955")
    ).toBeInTheDocument()
  })

  it("shows the power with the equipped items in the header and updates it with the stepper", async () => {
    env.authenticated = true
    env.roster = [goldTigurius]
    await renderUnit("/library/characters/ultraTigurius")

    const power = within(screen.getByTestId("unit-values"))
    expect(power.getByTestId("unit-power-value")).toHaveTextContent("16,809")
    expect(power.getByTestId("unit-power-note")).toHaveTextContent(
      "Includes your equipped items"
    )
    expect(
      within(screen.getByTestId("unit-glance-health")).getByText("1,786")
    ).toBeInTheDocument()

    fireEvent.click(
      within(screen.getByTestId("unit-ability-passive-stepper")).getByRole(
        "button",
        { name: "Raise level" }
      )
    )
    expect(
      screen.getByTestId("unit-ability-passive-stepper-value")
    ).toHaveTextContent("Lv 16")
    expect(screen.getByTestId("unit-power-value")).not.toHaveTextContent(
      "16,809"
    )
    expect(
      within(screen.getByTestId("unit-glance-health")).getByText("1,786")
    ).toBeInTheDocument()
  })

  it("drops the applied slots at a Custom rank, keeping the equipped item", async () => {
    env.authenticated = true
    env.roster = [goldTigurius]
    await renderUnit("/library/characters/ultraTigurius")

    // Epic stars cap the rank at Gold I, so the Custom rank that differs is a lower one.
    fireEvent.click(screen.getByTestId("unit-values-custom"))
    const [, rankSelect] = within(
      screen.getByTestId("unit-values")
    ).getAllByRole("combobox")
    if (!rankSelect) throw new Error("expected a rank select")
    fireEvent.click(rankSelect)
    fireEvent.click(screen.getByRole("option", { name: /Silver III$/ }))

    const expected = characterPowerAt(
      "ultraTigurius",
      {
        rank: "Silver3",
        progression: "Epic:RedOneStar",
        appliedUpgradeSlots: [],
        activeAbilityLevel: 20,
        passiveAbilityLevel: 15,
        items: [{ equipmentId: "I_Crit_C001", level: 3 }],
      },
      powerContext
    )!
    expect(screen.getByTestId("unit-power-value")).toHaveTextContent(
      expected.toLocaleString("en")
    )
    expect(screen.getByTestId("unit-power-note")).toHaveTextContent(
      "Includes your equipped items"
    )
  })

  it("shows the power without equipment signed out", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    expect(screen.getByTestId("unit-power-value")).toHaveTextContent(/^\d/)
    expect(screen.getByTestId("unit-power-note")).toHaveTextContent(
      "Without equipment"
    )
  })

  it("shows a placeholder while the power data loads", async () => {
    env.power = { status: "loading", retry: () => {} }
    await renderUnit("/library/characters/ultraTigurius")
    expect(screen.getByTestId("unit-power-loading")).toBeInTheDocument()
  })

  it("hides the power, marks the stats unavailable and keeps the rest of the page when the data failed", async () => {
    env.power = { status: "error", retry: () => {} }
    env.authenticated = true
    env.roster = [goldTigurius]
    await renderUnit("/library/characters/ultraTigurius")

    expect(screen.queryByTestId("unit-power")).not.toBeInTheDocument()
    expect(screen.getByTestId("unit-your-line")).toBeInTheDocument()
    expect(screen.getByTestId("unit-glance-health")).toHaveTextContent("—")
    expect(
      screen.getByTestId("unit-glance-stats-unavailable")
    ).toHaveTextContent("Stats data unavailable")
    expect(screen.getByTestId("unit-attack-melee")).toBeInTheDocument()
    expect(screen.getByTestId("unit-relic")).toBeInTheDocument()
    expect(screen.getByTestId("unit-radar-health")).toBeInTheDocument()
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

  it("holds the banner and state lines while a signed-in player's roster is still read", async () => {
    env.authenticated = true
    env.roster = [ownedTigurius]
    env.rosterPending = true
    await renderUnit("/library/characters/ultraTigurius")
    expect(screen.getByTestId("unit-header")).toBeInTheDocument()
    expect(screen.queryByTestId("unit-sign-in-banner")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("unit-showing-starting")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("unit-not-unlocked")).not.toBeInTheDocument()
  })

  it("keeps the power and stats loading while a signed-in player's record is still read", async () => {
    env.authenticated = true
    env.roster = [ownedTigurius]
    env.rosterPending = true
    await renderUnit("/library/characters/ultraTigurius")
    // Not the starting values' power, shown as ready before the player's own arrive.
    expect(env.power.status).toBe("ready")
    expect(screen.getByTestId("unit-power-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("unit-power-value")).not.toBeInTheDocument()
  })

  it("shows the missing-text state for both abilities of a character without rules text", async () => {
    await renderUnit("/library/characters/eldarLhykhis")
    expect(
      await screen.findByTestId("unit-ability-active-missing-text")
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
    expect(
      await screen.findByTestId("unit-relic-missing-text")
    ).toBeInTheDocument()
  })

  it("shows a relic's rules text at the stepper's level with the next level and a chart", async () => {
    env.extraCharacters = [hollan]
    env.extraEquipment = [voidwyrm]
    await renderUnit("/library/characters/genesBiophagus")
    const panel = screen.getByTestId("unit-relic")
    await screen.findByTestId("unit-relic-next")
    expect(panel).toHaveTextContent(
      "The relic bearer takes -390 Crit Damage for each friendly adjacent Summon or Decoy."
    )
    expect(screen.getByTestId("unit-relic-next")).toHaveTextContent("390 → 411")
    expect(
      screen.getByTestId("unit-relic-chart-critDmgReduction")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("unit-relic-missing-text")
    ).not.toBeInTheDocument()

    fireEvent.click(within(panel).getByRole("button", { name: "Raise level" }))
    expect(panel).toHaveTextContent("-411 Crit Damage")
    expect(screen.getByTestId("unit-relic-next")).toHaveTextContent("411 → 432")
  })

  it("shows the missing-text note for a relic with no rules text", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    // The fixture's Psychic Hood points at an ability with no rules-text entry.
    expect(screen.getByTestId("unit-relic")).toHaveTextContent("Psychic Hood")
    expect(
      await screen.findByTestId("unit-relic-missing-text")
    ).toHaveTextContent("Rules text isn't in the planner yet.")
    expect(screen.queryByTestId("unit-relic-stepper")).not.toBeInTheDocument()
    expect(
      within(screen.getByTestId("unit-relic")).queryByRole("figure")
    ).not.toBeInTheDocument()
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
      // Items show their localized names (equipmentItems), not the catalog's.
      /Mythic\s*Ancient Combat Knife.*Common\s*Combat Knife/
    )
    expect(list).not.toHaveTextContent("Standard-Issue Bolt Pistol")
    expect(list).not.toHaveTextContent("_I_Crit_C005")
    expect(list).not.toHaveTextContent("Particle Casters")
    fireEvent.click(crit)
    expect(screen.queryByTestId("unit-glance-items")).not.toBeInTheDocument()
  })

  it("shows an item's stats from level 1 to its last level on focus", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    fireEvent.click(screen.getByTestId("unit-glance-slot-I_Crit-toggle"))
    fireEvent.focus(screen.getByTestId("unit-item-I_Crit_M001"))
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Ancient Combat Knife · Mythic")
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

  describe("Mythic quests", () => {
    const abaddon = {
      ...tigurius,
      id: "blackAbaddon",
      name: "Abaddon",
      faction: "BlackLegion",
      alliance: "Chaos",
    }
    const lucius = {
      ...abaddon,
      id: "emperLucius",
      name: "Lucius",
      faction: "EmperorsChildren",
    }
    const weirdboy = {
      ...lhykhis,
      id: "orksWeirdboy",
      name: "Weirdboy",
      faction: "Orks",
    }
    // The quests are a separate catalog read that can land after the unit header renderUnit waits for.
    const renderQuests = async (url: string) => {
      await renderUnit(url)
      await screen.findByTestId("unit-mythic")
    }
    const questText = (number: number) =>
      within(screen.getByTestId(`unit-mythic-quest-${number}`))
        .getAllByRole("paragraph")
        .map((node) => node.textContent)
        .join(" ")

    it("lists a character's quests from the catalog with their tasks and rewards", async () => {
      env.extraCharacters = [abaddon]
      await renderQuests("/library/characters/blackAbaddon")
      const card = screen.getByTestId("unit-mythic")
      expect(card).toHaveTextContent("Mythic quests")
      expect(card).toHaveTextContent("5 quests")
      const first = screen.getByTestId("unit-mythic-quest-1")
      expect(first).toHaveTextContent(
        "Defeat 8 enemies that have the Emplacement trait with Abaddon in one battle"
      )
      expect(
        within(first)
          .getAllByRole("listitem")
          .map((chip) => chip.textContent)
      ).toEqual([
        "4 × Abaddon mythic shards",
        "2 × Mythic Chaos ascension orb",
        "1 × Mythic XP book",
      ])
    })

    it("has no card for a character the dataset has no record for", async () => {
      env.extraCharacters = [weirdboy]
      await renderUnit("/library/characters/orksWeirdboy")
      expect(screen.getByTestId("unit-details")).toBeInTheDocument()
      expect(screen.queryByTestId("unit-mythic")).not.toBeInTheDocument()
    })

    it("has no card when the dataset isn't in the client's catalog", async () => {
      env.extraCharacters = [abaddon]
      env.mythicQuestsSynced = false
      await renderUnit("/library/characters/blackAbaddon")
      expect(screen.getByTestId("unit-details")).toBeInTheDocument()
      expect(screen.getByTestId("unit-relic")).toBeInTheDocument()
      expect(screen.queryByTestId("unit-mythic")).not.toBeInTheDocument()
    })

    it("shows a quest's number and rewards without text when its task has no template", async () => {
      const [first, ...rest] = mythicQuestsFixture.records.find(
        (record) => record.unitId === "ultraCalgar"
      )!.quests
      if (!first) throw new Error("expected a quest")
      env.mythicQuestRecords = [
        {
          unitId: "ultraCalgar",
          quests: [
            {
              ...first,
              tasks: [{ ...first.tasks[0], locaKey: "NotATaskTemplate" }],
            },
            ...rest,
          ],
        },
      ]
      await renderQuests("/library/characters/ultraCalgar")
      const quest = screen.getByTestId("unit-mythic-quest-1")
      expect(quest).toHaveTextContent(/^1/)
      expect(within(quest).queryByRole("paragraph")).not.toBeInTheDocument()
      expect(quest).not.toHaveTextContent("NotATaskTemplate")
      expect(within(quest).getAllByRole("listitem")).toHaveLength(3)
    })

    it('keeps "in one battle" in the singular task text', async () => {
      await renderQuests("/library/characters/ultraCalgar")
      expect(screen.getByTestId("unit-mythic-quest-4")).toHaveTextContent(
        "Defeat 1 enemy that has the Immune trait with Calgar in one battle"
      )
    })

    it("names Lucius and the Armour of Shrieking Souls effect once each", async () => {
      env.extraCharacters = [lucius]
      await renderQuests("/library/characters/emperLucius")
      const text = questText(1)
      expect(text.match(/Lucius/g)).toHaveLength(1)
      expect(text.match(/Armour of Shrieking Souls/g)).toHaveLength(1)
      expect(text).toMatch(/in one battle$/)
    })

    it("shows the English task text with German labels in German", async () => {
      env.extraCharacters = [abaddon]
      // The harness loads English only; other namespaces fall back to it.
      i18n.addResourceBundle("de", "library", deLibrary)
      await i18n.changeLanguage("de")
      try {
        await renderQuests("/library/characters/blackAbaddon")
        const card = screen.getByTestId("unit-mythic")
        expect(card).toHaveTextContent("Mythische Quests")
        const first = screen.getByTestId("unit-mythic-quest-1")
        expect(first).toHaveTextContent(
          "Defeat 8 enemies that have the Emplacement trait with Abaddon in one battle"
        )
        expect(first).toHaveTextContent("Mythische Splitter von Abaddon")
      } finally {
        await i18n.changeLanguage("en")
      }
    })
  })

  it("shows each headline stat with its stat icon", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    for (const [key, file] of [
      ["health", "ui_icon_stat_health_01.webp"],
      ["damage", "ui_icon_stat_dmg_01.webp"],
      ["armour", "ui_icon_stat_armor_01.webp"],
      ["movement", "ui_icon_stat_move_01.webp"],
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

  it("shows the comparison radar's percentiles in the list only, not At a glance", async () => {
    await renderUnit("/library/characters/ultraTigurius")
    // Of the three characters, Tigurius has the lowest Health: 0% are strictly lower.
    expect(screen.getByTestId("unit-radar-health")).toHaveTextContent("0%")
    expect(screen.getByTestId("unit-glance-health")).not.toHaveTextContent(
      /percentile/
    )
    expect(screen.getByTestId("unit-radar-median")).toBeInTheDocument()
  })

  it("fades the ranks above the shown stars' cap in Stats by rank", async () => {
    // Signed out, Tigurius shows its starting Uncommon stars, capped at Bronze I.
    await renderUnit("/library/characters/ultraTigurius")
    const dimmed = screen.getByTestId("unit-stats-health-dimmed")
    // Stone I–III, Iron I–III, Bronze I: the fade starts at the 8th rank.
    expect(dimmed).toHaveAttribute("data-from", "7")
    expect(screen.getByTestId("unit-stats-by-rank")).toHaveTextContent(
      "Faded ranks are above Bronze I, the cap for these stars."
    )
  })

  it("marks the rows above the cap in the mobile Stats by rank table", async () => {
    env.isMobile = true
    await renderUnit("/library/characters/ultraTigurius")
    fireEvent.click(screen.getByRole("button", { name: /Stats by rank/ }))
    const rows = within(screen.getByTestId("unit-stats-table")).getAllByRole(
      "row"
    )
    // Header row, then one row per rank: the 8th rank (row 8) is the first above the cap.
    expect(rows[7]).not.toHaveAttribute("data-above-cap")
    expect(rows[8]).toHaveAttribute("data-above-cap", "true")
    expect(rows[8]).toHaveTextContent("above the cap for these stars")
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

  it("drops the calculator's range on prev/next and keeps only the tab", async () => {
    await renderUnit(
      "/library/characters/ultraTigurius?tab=rankup&rankStart=Gold1&rankEnd=Diamond3"
    )
    expect(
      screen.getByRole("link", { name: "Next unit: Lhykhis" })
    ).toHaveAttribute("href", "/library/characters/eldarLhykhis?tab=rankup")
    expect(
      screen.getByRole("link", { name: "Previous unit: Calgar" })
    ).toHaveAttribute("href", "/library/characters/ultraCalgar?tab=rankup")
  })

  it("returns to Collection and walks Collection's character order when opened from Collection", async () => {
    // Collection order (Lhykhis, Calgar, Tigurius) differs from the list's default order.
    await renderUnit(
      "/library/characters/ultraCalgar?tab=rankup",
      unitOriginState({
        kind: "collection",
        ids: ["eldarLhykhis", "ultraCalgar", "ultraTigurius"],
      })
    )

    const back = screen.getByTestId("unit-nav-back")
    expect(back).toHaveAttribute("href", "/my-game/collection")
    expect(back).toHaveTextContent("Collection")
    expect(back).toHaveAccessibleName("Back to Collection")
    expect(screen.getByTestId("unit-nav-position")).toHaveTextContent("2 of 3")
    expect(
      screen.getByRole("link", { name: "Previous unit: Lhykhis" })
    ).toHaveAttribute("href", "/library/characters/eldarLhykhis?tab=rankup")

    fireEvent.click(screen.getByRole("link", { name: "Next unit: Tigurius" }))
    await act(async () => {})

    // The origin carries over: still Collection's order and back to Collection.
    expect(screen.getByTestId("where")).toHaveTextContent(
      "/library/characters/ultraTigurius?tab=rankup"
    )
    expect(screen.getByTestId("unit-nav-position")).toHaveTextContent("3 of 3")
    expect(screen.getByTestId("unit-nav-next")).toBeDisabled()
    expect(screen.getByTestId("unit-nav-back")).toHaveAttribute(
      "href",
      "/my-game/collection"
    )
  })

  it("keeps the characters list as the back target without an origin", async () => {
    await renderUnit("/library/characters/ultraCalgar")

    const back = screen.getByTestId("unit-nav-back")
    expect(back).toHaveAttribute("href", "/library/characters")
    expect(back).toHaveAccessibleName("Back to Characters")
  })

  it("on mobile, names the icon-only back button Back to Collection when opened from Collection", async () => {
    env.isMobile = true
    await renderUnit(
      "/library/characters/ultraCalgar",
      unitOriginState({ kind: "collection", ids: ["ultraCalgar"] })
    )

    const back = screen.getByTestId("unit-nav-back")
    expect(back).not.toHaveTextContent("Collection")
    expect(back).toHaveAccessibleName("Back to Collection")
    expect(back).toHaveAttribute("href", "/my-game/collection")
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

  it("paints the page before the ability text arrives, then adds the tour's ability step", async () => {
    requestedNamespaces.length = 0
    const release = holdNamespaceLoads()
    await renderUnit("/library/characters/ultraTigurius")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Tigurius"
    )
    expect(
      screen.getByTestId("unit-ability-active-text-loading")
    ).toHaveTextContent("Loading rules text…")
    expect(
      screen.queryByTestId("unit-ability-active-missing-text")
    ).not.toBeInTheDocument()
    const targets = () => env.tour?.desktop.map((step) => step.target) ?? []
    expect(targets()).not.toContain('[data-testid="unit-ability-active"]')

    act(release)
    expect(
      await screen.findByTestId("unit-ability-active-stepper")
    ).toBeInTheDocument()
    expect(targets()).toContain('[data-testid="unit-ability-active"]')
    expect(
      requestedNamespaces.filter((key) => key.includes("AbilityText/")).sort()
    ).toEqual([
      // The relic's ability (`RunsAway`) is a known gap, so it is never requested.
      "en/npcAbilityText/PsychicFortress",
      "en/npcAbilityText/StormOfWrath",
    ])
  })

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
