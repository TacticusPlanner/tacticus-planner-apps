import { beforeAll, describe, expect, it } from "vitest"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { EquipmentId, UnitId } from "@workspace/game-domain"

import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import type { UnitTileUnit } from "../model/types"
import { UnitTile } from "./unit-tile"

let i18n: I18n

beforeAll(async () => {
  i18n = await createTestI18n("en")
})

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderTile(unit: UnitTileUnit) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/my-game/collection"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <UnitTile unit={unit} testId="tile" />
                <CurrentPath />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
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
      { equipmentId: "I_Block_L001" as EquipmentId, rarity: "Epic", level: 9 },
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

const calgar = (data: Partial<UnitTileUnit["data"]>): UnitTileUnit => ({
  kind: "character",
  unitId: "ultraCalgar" as UnitId,
  name: "Marneus Calgar",
  data: { state: "unowned", rarity: "Epic", ...data } as UnitTileUnit["data"],
})

describe("UnitTile", () => {
  it("shows every owned-character indicator on and under the portrait, and no power", () => {
    renderTile(titus)
    const tile = screen.getByTestId("tile")

    expect(tile).toHaveAttribute("data-state", "owned")
    expect(within(tile).getByTestId("unit-tile-portrait")).toHaveAttribute(
      "data-rarity",
      "Legendary"
    )
    const stars = within(tile).getByTestId("unit-tile-stars")
    expect(stars.querySelectorAll('img[src$="/stars/red.png"]')).toHaveLength(4)
    expect(
      within(tile).getByTestId("unit-tile-rank").querySelector("img")
    ).toHaveAttribute("src", expect.stringMatching(/\/ranks\/gold1\.png$/))
    expect(within(tile).getByTestId("unit-tile-shards")).toHaveTextContent(
      "120"
    )
    // Below a blue star only regular shards matter, so the mythic count is not shown.
    expect(
      within(tile).queryByTestId("unit-tile-mythic-shards")
    ).not.toBeInTheDocument()
    expect(tile).toHaveTextContent("Titus")
    expect(within(tile).getByTestId("unit-tile-numbers").textContent).toBe(
      "404538"
    )
    expect(within(tile).getAllByTestId("unit-tile-item")).toHaveLength(2)
    expect(within(tile).getAllByTestId("unit-tile-empty-slot")).toHaveLength(1)
    expect(tile.textContent).not.toMatch(/power/i)
  })

  it("spells the progression out in the tile's accessible name", () => {
    renderTile(titus)

    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Titus, Legendary, Red Four Stars, Gold I, level 45, Active ability level 40, passive ability level 38, 120 shards"
    )
  })

  it("shows only mythic shards from the first blue star on", () => {
    renderTile({
      ...titus,
      data: {
        ...titus.data,
        progression: "Legendary:OneBlueStar",
      } as UnitTileUnit["data"],
    })
    const tile = screen.getByTestId("tile")

    expect(
      within(tile).queryByTestId("unit-tile-shards")
    ).not.toBeInTheDocument()
    expect(
      within(tile).getByTestId("unit-tile-mythic-shards")
    ).toHaveTextContent("4")
    expect(screen.getByRole("group")).toHaveAccessibleName(
      expect.stringMatching(/, 4 mythic shards$/)
    )
  })

  it("does nothing when clicked (click-through to Library is Stage 4)", () => {
    renderTile(titus)

    fireEvent.click(screen.getByRole("group"))

    expect(screen.getByTestId("path")).toHaveTextContent("/my-game/collection")
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("shows a Machine of War's abilities and shards but no rank, XP level or equipment", () => {
    renderTile(ownedMow)
    const tile = screen.getByTestId("tile")

    expect(within(tile).getByTestId("unit-tile-numbers").textContent).toBe(
      "3025"
    )
    expect(within(tile).queryByTestId("unit-tile-rank")).not.toBeInTheDocument()
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
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Galatian, Epic, Red Two Stars, Primary ability level 30, secondary ability level 25, 12 shards"
    )
  })

  it("greys out an unowned character and shows its unlock progress", () => {
    renderTile(calgar({ shards: 75, mythicShards: 0, unlockShards: 400 }))
    const tile = screen.getByTestId("tile")

    expect(tile).toHaveAttribute("data-state", "unowned")
    expect(within(tile).getByTestId("unit-tile-portrait")).toHaveClass(
      "grayscale",
      "border-dashed"
    )
    expect(within(tile).getByTestId("unit-tile-shards")).toHaveTextContent(
      "75/400"
    )
    const bar = within(tile).getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "75")
    expect(bar).toHaveAttribute("aria-valuemax", "400")
    expect(
      within(tile).queryByTestId("unit-tile-stars")
    ).not.toBeInTheDocument()
    expect(
      within(tile).queryByTestId("unit-tile-numbers")
    ).not.toBeInTheDocument()
    expect(within(tile).queryByTestId("unit-tile-rank")).not.toBeInTheDocument()
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Marneus Calgar, not unlocked, 75 of 400 shards to unlock"
    )
  })

  it("shows an unowned Machine of War's shard count alone, without a bar", () => {
    renderTile({
      kind: "mow",
      unitId: "ultraDreadnought" as UnitId,
      name: "Galatian",
      data: { state: "unowned", shards: 30, mythicShards: 2 },
    })
    const tile = screen.getByTestId("tile")

    expect(within(tile).getByTestId("unit-tile-shards")).toHaveTextContent("30")
    expect(within(tile).getByTestId("unit-tile-shards")).not.toHaveTextContent(
      "/"
    )
    expect(within(tile).queryByRole("progressbar")).not.toBeInTheDocument()
    expect(
      within(tile).getByTestId("unit-tile-mythic-shards")
    ).toHaveTextContent("2")
  })

  it("shows the starting rarity instead of a shard count when shard data is unknown", () => {
    renderTile(calgar({}))

    expect(screen.queryByTestId("unit-tile-shards")).not.toBeInTheDocument()
    expect(screen.getByTestId("unit-tile-starts")).toHaveTextContent(
      "Starts Epic"
    )
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Marneus Calgar, not unlocked, Starts Epic"
    )
  })
})
