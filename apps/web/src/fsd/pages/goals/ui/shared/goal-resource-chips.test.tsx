import { render, screen, within } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key.startsWith("goals.resourceChips.rarity.")) {
        return key.split(".").pop()
      }
      if (key === "goals.resourceChips.chipLabel") {
        return `${opts?.name}: ${opts?.quantity}`
      }
      if (key === "goals.resourceChips.xpBooksValue") {
        return `${opts?.available} of ${opts?.needed}`
      }
      return opts?.rarity ? `${opts.rarity} ${key.split(".").pop()}` : key
    },
    i18n: { resolvedLanguage: "en" },
  }),
}))

import type { ResourceNeed } from "@/features/goal-farming"
import { GoalResourceChips } from "./goal-resource-chips"

const need = (overrides: Partial<ResourceNeed> = {}): ResourceNeed => ({
  upgrades: [{ id: "upgSlot", count: 9 }] as never,
  shardId: null,
  shards: 0,
  mythicShards: 0,
  orbsByType: {},
  upgradeSlotsRemaining: 9,
  ...overrides,
})

const abilityMaterials = {
  gold: 12_000,
  badgesByRarity: { Epic: 4 },
  forgeBadgesByRarity: { Rare: 2 },
  components: 30,
}

const chipNames = () =>
  screen
    .queryAllByTestId("goal-resource-chip")
    .map((chip) => within(chip).getByRole("img").getAttribute("aria-label"))

describe("GoalResourceChips", () => {
  it("Rank: energy with a thousands separator, XP books when a level-up is needed, no material chips", () => {
    render(
      <GoalResourceChips
        energy={1674}
        entityType="Character"
        goalType="Rank"
        remaining={need()}
        xpBooks={{ needed: 6, available: 4, rarity: "Legendary" }}
      />
    )
    expect(chipNames()).toEqual([
      "goals.resourceChips.energy: 1,674",
      "Legendary xpBooks: 4 of 6",
    ])
  })

  it("hides the XP-book chip when no level-up is needed", () => {
    render(
      <GoalResourceChips
        energy={10}
        entityType="Character"
        goalType="Rank"
        remaining={need()}
        xpBooks={{ needed: 0, available: 0, rarity: "Legendary" }}
      />
    )
    expect(chipNames()).toEqual(["goals.resourceChips.energy: 10"])
  })

  it("Ascension: orbs by rarity, shards, mythic shards and energy; zero quantities omitted", () => {
    render(
      <GoalResourceChips
        energy={50}
        entityType="Character"
        goalType="Ascension"
        remaining={need({
          orbsByType: { Rare: 3, Epic: 0 },
          shards: 200,
          mythicShards: 0,
        })}
      />
    )
    expect(chipNames()).toEqual([
      "Rare orbs: 3",
      "goals.resourceChips.shards: 200",
      "goals.resourceChips.energy: 50",
    ])
  })

  it("Unlock: shards and energy", () => {
    render(
      <GoalResourceChips
        energy={5}
        entityType="Character"
        goalType="Unlock"
        remaining={need({ shards: 227 })}
      />
    )
    expect(chipNames()).toEqual([
      "goals.resourceChips.shards: 227",
      "goals.resourceChips.energy: 5",
    ])
  })

  it("MoW Ability: badges, forge badges, components and gold, never an XP-book chip", () => {
    render(
      <GoalResourceChips
        energy={undefined}
        entityType="Mow"
        goalType="Ability"
        remaining={need({ abilityMaterials })}
        xpBooks={{ needed: 6, available: 4, rarity: "Legendary" }}
      />
    )
    expect(chipNames()).toEqual([
      "Epic abilityBadges: 4",
      "Rare forgeBadges: 2",
      "goals.resourceChips.components: 30",
      "goals.resourceChips.gold: 12,000",
    ])
  })

  it("Character Ability: badges and gold, plus XP books when a level-up is needed", () => {
    render(
      <GoalResourceChips
        energy={undefined}
        entityType="Character"
        goalType="Ability"
        remaining={need({
          abilityMaterials: {
            ...abilityMaterials,
            forgeBadgesByRarity: {},
            components: 0,
          },
        })}
        xpBooks={{ needed: 2, available: 1, rarity: "Epic" }}
      />
    )
    expect(chipNames()).toEqual([
      "Epic abilityBadges: 4",
      "goals.resourceChips.gold: 12,000",
      "Epic xpBooks: 1 of 2",
    ])
  })

  it("Upgrade: energy only", () => {
    render(
      <GoalResourceChips
        energy={80}
        entityType="Character"
        goalType="Upgrade"
        remaining={need()}
      />
    )
    expect(chipNames()).toEqual(["goals.resourceChips.energy: 80"])
  })

  it("renders each chip's icon and nothing when there is nothing to show", () => {
    const { container, unmount } = render(
      <GoalResourceChips
        energy={undefined}
        entityType="Mow"
        goalType="Ability"
        remaining={need({ abilityMaterials })}
      />
    )
    expect(container.querySelectorAll("img").length).toBe(4)
    unmount()
    const empty = render(
      <GoalResourceChips
        energy={0}
        entityType="Character"
        goalType="Rank"
        remaining={need()}
      />
    )
    expect(empty.container).toBeEmptyDOMElement()
  })

  it("collapses overflow into +N with the full list in its tooltip", () => {
    render(
      <GoalResourceChips
        energy={9}
        entityType="Mow"
        goalType="Ability"
        remaining={need({
          abilityMaterials: {
            gold: 1,
            badgesByRarity: { Common: 1, Rare: 1, Epic: 1 },
            forgeBadgesByRarity: { Rare: 1, Epic: 1 },
            components: 1,
          },
        })}
      />
    )
    const overflow = screen.getByTestId("goal-resource-chips-overflow")
    expect(overflow).toHaveTextContent("+2")
    expect(within(overflow).getByRole("img")).toHaveAttribute(
      "title",
      expect.stringContaining("goals.resourceChips.gold: 1")
    )
    expect(screen.getAllByTestId("goal-resource-chip")).toHaveLength(5)
  })
})
