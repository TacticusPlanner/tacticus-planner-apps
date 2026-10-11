import { afterEach, beforeAll, describe, expect, it } from "vitest"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"
import type { EquipmentId, UnitId } from "@workspace/game-domain"

import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"
import { vi } from "vitest"

import type { UnitTileUnit } from "../model/types"
import { UnitTile } from "./unit-tile"

let i18n: I18n

beforeAll(async () => {
  i18n = await createTestI18n("en")
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderTile(unit: UnitTileUnit, width = 1280) {
  setViewportWidth(width)
  return render(
    <I18nextProvider i18n={i18n}>
      <UnitTile unit={unit} testId="tile" />
    </I18nextProvider>
  )
}

const titus: UnitTileUnit = {
  kind: "character",
  unitId: "ultraTitus" as UnitId,
  name: "Titus",
  data: {
    state: "owned",
    progression: "Legendary:RedFourStars",
    rank: "Gold1",
    xpLevel: 45,
    abilityLevels: [40, 38],
    equipment: [
      {
        equipmentId: "I_Crit_L001" as EquipmentId,
        rarity: "Legendary",
        level: 10,
      },
      {
        equipmentId: "I_Block_L001" as EquipmentId,
        rarity: "Legendary",
        level: 9,
      },
      { equipmentId: "I_Defensive_L001" as EquipmentId, level: 8 },
    ],
    shards: 120,
    mythicShards: 4,
  },
}

const ownedMow: UnitTileUnit = {
  kind: "mow",
  unitId: "ultraDreadnought" as UnitId,
  name: "Galatian",
  data: {
    state: "owned",
    progression: "Epic:RedTwoStars",
    abilityLevels: [30, 25],
    shards: 12,
    mythicShards: 0,
  },
}

describe("UnitTile", () => {
  it("shows every owned-character indicator and no power", () => {
    renderTile(titus)
    const tile = screen.getByTestId("tile")

    expect(tile).toHaveAttribute("data-state", "owned")
    expect(
      tile.querySelector(".ring-\\[var\\(--rarity-legendary\\)\\]")
    ).not.toBeNull()
    expect(
      within(tile).getByTestId("unit-tile-stars").querySelectorAll("img")
    ).toHaveLength(4)
    expect(tile.querySelector('img[src$="/ranks/gold1.png"]')).not.toBeNull()
    expect(within(tile).getByTestId("unit-tile-xp-level")).toHaveTextContent(
      "45"
    )
    expect(
      within(tile).getByTestId("unit-tile-abilities")
    ).toHaveAccessibleName("Active ability level 40, passive ability level 38")
    expect(
      within(tile)
        .getByTestId("unit-tile-equipment")
        .querySelectorAll('img[src*="ui_icon_item_"]')
    ).toHaveLength(3)
    expect(within(tile).getByTestId("unit-tile-shards")).toHaveAccessibleName(
      "120 shards"
    )
    expect(
      within(tile).getByTestId("unit-tile-mythic-shards")
    ).toHaveAccessibleName("4 mythic shards")
    expect(tile.textContent).not.toMatch(/power/i)
  })

  it("shows a Machine of War's abilities and shards but no rank, XP level or equipment", () => {
    renderTile(ownedMow)
    const tile = screen.getByTestId("tile")

    expect(
      within(tile).getByTestId("unit-tile-abilities")
    ).toHaveAccessibleName(
      "Primary ability level 30, secondary ability level 25"
    )
    expect(tile.querySelector('img[src*="/ranks/"]')).toBeNull()
    expect(
      within(tile).queryByTestId("unit-tile-xp-level")
    ).not.toBeInTheDocument()
    expect(
      within(tile).queryByTestId("unit-tile-equipment")
    ).not.toBeInTheDocument()
    expect(within(tile).getByTestId("unit-tile-shards")).toHaveTextContent("12")
    expect(
      within(tile).queryByTestId("unit-tile-mythic-shards")
    ).not.toBeInTheDocument()
  })

  it("greys out an unowned character and shows its shards toward unlocking", () => {
    renderTile({
      kind: "character",
      unitId: "ultraCalgar" as UnitId,
      name: "Marneus Calgar",
      data: {
        state: "unowned",
        rarity: "Epic",
        shards: 75,
        mythicShards: 0,
        unlockShards: 400,
      },
    })
    const tile = screen.getByTestId("tile")

    expect(tile).toHaveAttribute("data-state", "unowned")
    expect(
      tile.querySelector(".grayscale.ring-\\[var\\(--rarity-epic\\)\\]")
    ).not.toBeNull()
    expect(within(tile).getByTestId("unit-tile-shards")).toHaveTextContent(
      "75/400"
    )
    expect(within(tile).getByTestId("unit-tile-shards")).toHaveAccessibleName(
      "75 of 400 shards to unlock"
    )
    expect(
      within(tile).queryByTestId("unit-tile-stars")
    ).not.toBeInTheDocument()
    expect(
      within(tile).queryByTestId("unit-tile-abilities")
    ).not.toBeInTheDocument()
    expect(tile.querySelector('img[src*="/ranks/"]')).toBeNull()
  })

  it("shows an unowned Machine of War's shard count alone, with a neutral frame", () => {
    renderTile({
      kind: "mow",
      unitId: "ultraDreadnought" as UnitId,
      name: "Galatian",
      data: { state: "unowned", shards: 30, mythicShards: 2 },
    })
    const tile = screen.getByTestId("tile")

    expect(tile.querySelector(".grayscale.ring-border")).not.toBeNull()
    expect(within(tile).getByTestId("unit-tile-shards")).toHaveTextContent("30")
    expect(within(tile).getByTestId("unit-tile-shards")).not.toHaveTextContent(
      "/"
    )
    expect(
      within(tile).getByTestId("unit-tile-mythic-shards")
    ).toHaveTextContent("2")
  })

  it("shows no shard count when shard data is unknown", () => {
    renderTile({
      kind: "character",
      unitId: "ultraCalgar" as UnitId,
      name: "Marneus Calgar",
      data: { state: "unowned", rarity: "Epic" },
    })

    expect(screen.queryByTestId("unit-tile-shards")).not.toBeInTheDocument()
  })

  it("is named by the unit and does nothing when clicked", () => {
    const { container } = renderTile(titus)
    const before = container.innerHTML

    fireEvent.click(screen.getByRole("group", { name: "Titus" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByTestId("tile").tagName).toBe("DIV")
    expect(container.innerHTML).toBe(before)
  })

  it("shows the unit name as a tooltip on desktop keyboard focus", async () => {
    renderTile(titus, 1280)

    fireEvent.focus(screen.getByTestId("tile"))

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Titus")
  })

  it("has no tooltip and is not focusable on mobile", () => {
    renderTile(titus, 420)
    const tile = screen.getByTestId("tile")

    expect(tile).not.toHaveAttribute("tabindex")
    fireEvent.focus(tile)
    fireEvent.pointerMove(tile)

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    expect(tile).toHaveAccessibleName("Titus")
  })
})
