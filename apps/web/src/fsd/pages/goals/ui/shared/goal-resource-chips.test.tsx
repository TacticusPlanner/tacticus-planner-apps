import { cleanup } from "@testing-library/react"
import { render, screen, within } from "@/test/render"
import { describe, expect, it } from "vitest"

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
  it("shows gold in thousands (k, rounded down) but keeps the full value in the label", () => {
    const shown = (levelGold: number) => {
      cleanup()
      render(
        <GoalResourceChips
          energy={undefined}
          entityType="Character"
          goalType="Rank"
          remaining={need({ levelGold })}
        />
      )
      const chip = screen.getByTestId("goal-resource-chip")
      return {
        text: chip.textContent,
        label: within(chip).getByRole("img").getAttribute("aria-label"),
      }
    }
    expect(shown(42_235)).toEqual({
      text: "42k",
      label: "Gold: 42,235",
    })
    expect(shown(1_999).text).toBe("1k")
    expect(shown(750).text).toBe("750")
  })

  it("Rank: gold to apply the level-up books, then energy (never an XP-book chip)", () => {
    render(
      <GoalResourceChips
        energy={1674}
        entityType="Character"
        goalType="Rank"
        remaining={need({ levelGold: 42_000 })}
      />
    )
    expect(chipNames()).toEqual(["Energy: 1,674", "Gold: 42,000"])
  })

  it("Rank: energy with a thousands separator, no material chips", () => {
    render(
      <GoalResourceChips
        energy={1674}
        entityType="Character"
        goalType="Rank"
        remaining={need()}
      />
    )
    expect(chipNames()).toEqual(["Energy: 1,674"])
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
    expect(chipNames()).toEqual(["Energy: 50", "Rare orbs: 3", "Shards: 200"])
  })

  it("Ascension in the plan: orbs read available/needed, uncapped, even when fully held", () => {
    render(
      <GoalResourceChips
        energy={undefined}
        entityType="Character"
        goalType="Ascension"
        remaining={need({
          orbsByType: { Epic: 4 },
          orbPool: {
            neededByRarity: { Rare: 10, Epic: 20 },
            availableByRarity: { Rare: 35, Epic: 16 },
          },
        })}
      />
    )
    expect(chipNames()).toEqual(["Rare orbs: 35 of 10", "Epic orbs: 16 of 20"])
    expect(screen.getAllByTestId("goal-resource-chip")[1]).toHaveTextContent(
      "16/20"
    )
  })

  it("Ascension: energy, gold, then onslaught tokens lead; orbs and shards follow", () => {
    render(
      <GoalResourceChips
        energy={50}
        entityType="Character"
        goalType="Ascension"
        onslaughtTokens={7}
        remaining={need({ orbsByType: { Rare: 3 }, shards: 200 })}
      />
    )
    expect(chipNames()).toEqual([
      "Energy: 50",
      "Onslaught tokens: 7",
      "Rare orbs: 3",
      "Shards: 200",
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
    expect(chipNames()).toEqual(["Energy: 5", "Shards: 227"])
  })

  it("MoW Ability: available/needed badges, forge badges and components, then gold and energy", () => {
    render(
      <GoalResourceChips
        energy={900}
        entityType="Mow"
        goalType="Ability"
        remaining={need({
          abilityMaterials: {
            ...abilityMaterials,
            badgesByRarity: { Legendary: 27 },
            forgeBadgesByRarity: { Legendary: 27 },
            components: 138,
            available: {
              badgesByRarity: { Legendary: 27 },
              forgeBadgesByRarity: { Legendary: 30 },
              components: 118,
            },
          },
        })}
      />
    )
    expect(
      screen.getAllByTestId("goal-resource-chip").map((c) => c.textContent)
    ).toEqual(["900", "12k", "27/27", "30/27", "118/138"])
    expect(chipNames()).toEqual([
      "Energy: 900",
      "Gold: 12,000",
      "Legendary ability badges: 27 of 27",
      "Legendary forge badges: 30 of 27",
      "Machine of War components: 118 of 138",
    ])
  })

  it("uses the alliance art for badges (frame + emblem), components and orbs, and the energy glyph", () => {
    const { container } = render(
      <GoalResourceChips
        energy={5}
        entityType="Mow"
        goalType="Ability"
        remaining={need({ alliance: "Xenos", abilityMaterials })}
      />
    )
    const sources = [...container.querySelectorAll("img")].map((img) =>
      img.getAttribute("src")
    )
    expect(sources).toEqual([
      "/game_catalog/datamines/atlases/ui_icon_resource_stamina_small.webp",
      "/game_catalog/datamines/atlases/ui_icon_resource_coin_small.webp",
      "/game_catalog/datamines/atlases/ui_ability_badges_epic.webp",
      "/game_catalog/datamines/atlases/ui_ability_badges_xenos.webp",
      "/game_catalog/datamines/atlases/ui_forge_badges_rare.webp",
      "/game_catalog/datamines/atlases/ui_machines_of_war_tokens_xenos.webp",
    ])
    cleanup()
    const orbs = render(
      <GoalResourceChips
        energy={undefined}
        entityType="Character"
        goalType="Ascension"
        remaining={need({ alliance: "Chaos", orbsByType: { Rare: 3 } })}
      />
    )
    expect(
      [...orbs.container.querySelectorAll("img")].map((img) =>
        img.getAttribute("src")
      )
    ).toEqual([
      "/game_catalog/datamines/atlases/ui_hero_ascension_orbs_rare.webp",
      "/game_catalog/datamines/atlases/ui_hero_ascension_orbs_chaos.webp",
    ])
  })

  it("MoW Ability without available stock shows 0/needed; no need shows no chip", () => {
    render(
      <GoalResourceChips
        energy={undefined}
        entityType="Mow"
        goalType="Ability"
        remaining={need({
          abilityMaterials: {
            gold: 0,
            badgesByRarity: { Epic: 4 },
            forgeBadgesByRarity: {},
            components: 0,
          },
        })}
      />
    )
    expect(chipNames()).toEqual(["Epic ability badges: 0 of 4"])
  })

  it("Character Ability: badges and gold", () => {
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
      />
    )
    expect(chipNames()).toEqual(["Gold: 12,000", "Epic ability badges: 4"])
  })

  it("Character Ability in the plan: badges read available/needed like V1's x/y", () => {
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
            available: {
              badgesByRarity: { Epic: 3 },
              forgeBadgesByRarity: {},
              components: 0,
            },
          },
        })}
      />
    )
    expect(chipNames()).toEqual(["Gold: 12,000", "Epic ability badges: 3 of 4"])
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
    expect(chipNames()).toEqual(["Energy: 80"])
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
    // Gold, a two-layer ability badge, a forge badge and components.
    expect(container.querySelectorAll("img").length).toBe(5)
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

  it("renders every chip of a Machine of War ability goal, with no +N overflow", () => {
    render(
      <GoalResourceChips
        energy={9}
        entityType="Mow"
        goalType="Ability"
        onslaughtTokens={2}
        remaining={need({
          abilityMaterials: {
            gold: 1,
            badgesByRarity: {
              Common: 1,
              Uncommon: 1,
              Rare: 1,
              Epic: 1,
              Legendary: 1,
            },
            forgeBadgesByRarity: { Rare: 1, Epic: 1, Legendary: 1 },
            components: 1,
          },
        })}
      />
    )
    expect(screen.getAllByTestId("goal-resource-chip")).toHaveLength(12)
    expect(screen.queryByTestId("goal-resource-chips-overflow")).toBeNull()
  })

  describe("Onslaught tokens", () => {
    const renderTokens = (
      energy: number | undefined,
      onslaughtTokens: number | undefined
    ) => {
      cleanup()
      render(
        <GoalResourceChips
          energy={energy}
          entityType="Character"
          goalType="Unlock"
          onslaughtTokens={onslaughtTokens}
          remaining={need()}
        />
      )
      return chipNames()
    }

    it("shows a token chip and no energy chip for an Onslaught-only goal", () => {
      expect(renderTokens(0, 30)).toEqual(["Onslaught tokens: 30"])
    })

    it("shows energy and tokens for a mixed goal", () => {
      expect(renderTokens(400, 12)).toEqual([
        "Energy: 400",
        "Onslaught tokens: 12",
      ])
    })

    it("shows no token chip without an Onslaught source", () => {
      expect(renderTokens(400, undefined)).toEqual(["Energy: 400"])
      expect(renderTokens(400, 0)).toEqual(["Energy: 400"])
    })
  })

  it("adds the standalone slots and energy to the energy chip's tooltip, keeping the marginal figure", () => {
    render(
      <GoalResourceChips
        energy={1995}
        entityType="Character"
        goalType="Rank"
        remaining={need({ standalone: { slots: 12, energy: 3410 } })}
      />
    )
    const chip = screen.getByTestId("goal-resource-chip")
    expect(chip).toHaveTextContent("1,995")
    const title = within(chip).getByRole("img").getAttribute("title")
    expect(title).toContain("Energy: 1,995")
    expect(title).toContain("Standalone: 12 upgrade slots, 3,410 energy")
  })

  it("shows no standalone tooltip content without overlap", () => {
    cleanup()
    render(
      <GoalResourceChips
        energy={1995}
        entityType="Character"
        goalType="Rank"
        remaining={need()}
      />
    )
    expect(
      within(screen.getByTestId("goal-resource-chip"))
        .getByRole("img")
        .getAttribute("title")
    ).not.toContain("Standalone")
  })
  describe("shop currency", () => {
    it("shows the currency still to spend beside the shard chip, grouped per currency", () => {
      render(
        <GoalResourceChips
          energy={undefined}
          entityType="Character"
          goalType="Unlock"
          remaining={need({ shards: 500, shardId: "shards" as never })}
          shopSpend={
            new Map([
              ["guildWarCurrency", 90_000.4],
              ["elderShopCurrency", 1_200],
            ])
          }
        />
      )

      expect(chipNames()).toEqual([
        "Shards: 500",
        "Guild War Coins: 90,000",
        "Rogue Trader Currency: 1,200",
      ])
    })

    it("shows no currency chip without a shop spend or when it rounds to zero", () => {
      const { rerender } = render(
        <GoalResourceChips
          energy={undefined}
          entityType="Character"
          goalType="Unlock"
          remaining={need({ shards: 500, shardId: "shards" as never })}
        />
      )
      expect(chipNames()).toEqual(["Shards: 500"])

      rerender(
        <GoalResourceChips
          energy={undefined}
          entityType="Character"
          goalType="Unlock"
          remaining={need({ shards: 500, shardId: "shards" as never })}
          shopSpend={new Map([["guildWarCurrency", 0.2]])}
        />
      )
      expect(chipNames()).toEqual(["Shards: 500"])
    })
  })
})
