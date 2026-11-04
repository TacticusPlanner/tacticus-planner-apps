import { useState } from "react"
import { beforeAll, describe, expect, it } from "vitest"
import type { i18n as I18n } from "i18next"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import type { EquipmentId, UnitId } from "@workspace/game-domain"

import { createTestI18n } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import type { UnitTileUnit } from "../model/types"
import { UnitRosterRow } from "./unit-roster-row"

let i18n: I18n

beforeAll(async () => {
  i18n = await createTestI18n("en")
})

function Location() {
  const location = useLocation()
  return (
    <>
      <p data-testid="path">{location.pathname}</p>
      <p data-testid="state">{JSON.stringify(location.state)}</p>
    </>
  )
}

/** Holds the expanded flag the way the Roster view does, so the toggle can be exercised. */
function Expandable({
  unit,
  link,
}: {
  unit: UnitTileUnit
  link?: { to: string; state?: unknown }
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <UnitRosterRow
      unit={unit}
      link={link}
      form="expandable"
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
      testId="row"
    />
  )
}

function renderRow(
  unit: UnitTileUnit,
  {
    link,
    form = "link",
  }: {
    link?: { to: string; state?: unknown }
    form?: "link" | "expandable"
  } = {}
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/my-game/collection"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                {form === "link" ? (
                  <UnitRosterRow unit={unit} link={link} testId="row" />
                ) : (
                  <Expandable unit={unit} link={link} />
                )}
                <Location />
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

const titusLabel =
  "Titus, Legendary, Red Four Stars, Gold I, level 45, Active ability level 40, passive ability level 38, 120 shards"

describe("UnitRosterRow as a link (desktop)", () => {
  it("shows an owned character's columns in order on one row", () => {
    renderRow(titus)
    const row = screen.getByTestId("row")

    expect(row).toHaveAttribute("data-state", "owned")
    expect(within(row).getByTestId("unit-row-portrait")).toHaveAttribute(
      "data-rarity",
      "Legendary"
    )
    expect(
      within(row).getByTestId("unit-row-rank").querySelector("img")
    ).toHaveAttribute("src", expect.stringMatching(/\/fonts\/Rank_12\.webp$/))
    const stars = within(row).getByTestId("unit-row-stars")
    expect(stars).toHaveTextContent("4")
    expect(
      stars.querySelector('img[src$="/ui_icon_star_herodetail_epic_01.webp"]')
    ).not.toBeNull()
    expect(within(row).getByTestId("unit-row-level")).toHaveTextContent("Lv 45")
    // Name, stars count, level, active, passive, then the two item levels.
    expect(row.textContent).toBe("Titus4Lv 454038109")
    expect(within(row).getAllByTestId("unit-tile-item")).toHaveLength(2)
    expect(within(row).getAllByTestId("unit-tile-empty-slot")).toHaveLength(1)
  })

  it("is one link named by the tile's spelled-out progression, carrying its state", () => {
    renderRow(titus, {
      link: { to: "/library/characters/ultraTitus", state: { from: "x" } },
    })
    const link = screen.getByRole("link")

    expect(link).toBe(screen.getByTestId("row"))
    expect(link).toHaveAccessibleName(titusLabel)
    expect(link).toHaveAttribute("href", "/library/characters/ultraTitus")
    link.focus()
    expect(link).toHaveFocus()

    fireEvent.click(link)
    expect(screen.getByTestId("path")).toHaveTextContent(
      "/library/characters/ultraTitus"
    )
    expect(screen.getByTestId("state")).toHaveTextContent('{"from":"x"}')
  })

  it("leaves a Machine of War's rank, level and equipment cells empty, keeping the columns", () => {
    renderRow(ownedMow)
    const row = screen.getByTestId("row")

    // Portrait, name, rank, stars, level, two abilities, equipment: one cell per column.
    expect(row.children).toHaveLength(8)
    expect(within(row).queryByTestId("unit-row-rank")).not.toBeInTheDocument()
    expect(within(row).queryByTestId("unit-row-level")).not.toBeInTheDocument()
    expect(
      within(row).queryByTestId("unit-row-equipment")
    ).not.toBeInTheDocument()
    expect(row.children[5]).toHaveTextContent("30")
    expect(row.children[6]).toHaveTextContent("25")
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Galatian, Epic, Red Two Stars, Primary ability level 30, secondary ability level 25, 12 shards"
    )
  })

  it("lines a character row's ability columns up with a Machine of War's", () => {
    renderRow(titus)
    const character = screen.getByTestId("row")
    expect(character.children).toHaveLength(8)
    expect(character.children[5]).toHaveTextContent("40")
    expect(character.children[6]).toHaveTextContent("38")
  })

  it("greys out an unowned character and shows its unlock progress instead of stats", () => {
    renderRow(calgar({ shards: 75, mythicShards: 0, unlockShards: 400 }))
    const row = screen.getByTestId("row")

    expect(row).toHaveAttribute("data-state", "unowned")
    expect(within(row).getByTestId("unit-row-portrait")).toHaveClass(
      "grayscale",
      "border-dashed"
    )
    expect(within(row).getByTestId("unit-tile-shards")).toHaveTextContent(
      "75/400"
    )
    const bar = within(row).getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "75")
    expect(bar).toHaveAttribute("aria-valuemax", "400")
    expect(within(row).queryByTestId("unit-row-stars")).not.toBeInTheDocument()
    expect(within(row).queryByTestId("unit-row-level")).not.toBeInTheDocument()
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Marneus Calgar, not unlocked, 75 of 400 shards to unlock"
    )
  })

  it("shows an unowned Machine of War's shard count alone", () => {
    renderRow({
      kind: "mow",
      unitId: "ultraDreadnought" as UnitId,
      name: "Galatian",
      data: { state: "unowned", shards: 30, mythicShards: 0 },
    })

    expect(screen.getByTestId("unit-tile-shards")).toHaveTextContent("30")
    expect(screen.getByTestId("unit-tile-shards")).not.toHaveTextContent("/")
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("shows the starting rarity without a roster", () => {
    renderRow(calgar({}))

    expect(screen.getByTestId("unit-tile-starts")).toHaveTextContent(
      "Starts Epic"
    )
    expect(screen.getByRole("group")).toHaveAccessibleName(
      "Marneus Calgar, not unlocked, Starts Epic"
    )
  })
})

describe("UnitRosterRow as an expandable row (mobile)", () => {
  const link = { to: "/library/characters/ultraTitus", state: { from: "x" } }

  it("is a collapsed button named by the progression that expands in place", () => {
    renderRow(titus, { link, form: "expandable" })
    const button = screen.getByRole("button", { name: titusLabel })

    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    // Collapsed: the columns that fit, without abilities or equipment.
    expect(within(button).getByTestId("unit-row-level")).toHaveTextContent(
      "Lv 45"
    )
    expect(
      within(button).queryByTestId("unit-row-equipment")
    ).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByTestId("path")).toHaveTextContent("/my-game/collection")
    const panel = document.getElementById(
      button.getAttribute("aria-controls")!
    )!
    expect(panel).toBeVisible()
    expect(within(panel).getByText("Active").nextSibling).toHaveTextContent(
      "40"
    )
    expect(within(panel).getByText("Passive").nextSibling).toHaveTextContent(
      "38"
    )
    expect(within(panel).getAllByTestId("unit-tile-item")).toHaveLength(2)
    expect(within(panel).getByTestId("unit-row-shards")).toHaveTextContent(
      "120"
    )

    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-expanded", "false")
  })

  it("opens the unit page with its state from the expanded panel's link", () => {
    renderRow(titus, { link, form: "expandable" })
    fireEvent.click(screen.getByRole("button", { name: titusLabel }))

    fireEvent.click(screen.getByRole("link", { name: "Open Titus" }))

    expect(screen.getByTestId("path")).toHaveTextContent(
      "/library/characters/ultraTitus"
    )
    expect(screen.getByTestId("state")).toHaveTextContent('{"from":"x"}')
  })

  it("shows only mythic shards in the panel from the first blue star on", () => {
    renderRow(
      {
        ...titus,
        data: {
          ...titus.data,
          progression: "Legendary:OneBlueStar",
        } as UnitTileUnit["data"],
      },
      { link, form: "expandable" }
    )
    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByTestId("unit-row-mythic-shards")).toHaveTextContent("4")
    expect(screen.queryByTestId("unit-row-shards")).not.toBeInTheDocument()
  })

  it("names a Machine of War's abilities primary and secondary, without equipment", () => {
    renderRow(ownedMow, { link, form: "expandable" })
    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByText("Primary").nextSibling).toHaveTextContent("30")
    expect(screen.getByText("Secondary").nextSibling).toHaveTextContent("25")
    expect(screen.queryByText("Equipment")).not.toBeInTheDocument()
  })

  it("expands an unowned row to its unlock progress", () => {
    renderRow(calgar({ shards: 75, mythicShards: 0, unlockShards: 400 }), {
      link,
      form: "expandable",
    })
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "75"
    )
    expect(
      screen.getByRole("link", { name: "Open Marneus Calgar" })
    ).toBeInTheDocument()
  })
})

describe("UnitRosterRow with a faction (ungrouped list)", () => {
  const faction = { id: "Ultramarines", name: "Ultramarines" }

  it("adds a leading faction column and the faction to the name", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <UnitRosterRow unit={titus} faction={faction} testId="row" />
        </MemoryRouter>
      </I18nextProvider>
    )
    const row = screen.getByTestId("row")

    expect(row.children).toHaveLength(9)
    expect(row.children[0]).toHaveAttribute("data-faction", "Ultramarines")
    expect(screen.getByRole("group")).toHaveAccessibleName(
      expect.stringMatching(/^Titus, Ultramarines, Legendary,/)
    )
  })

  it("shows the faction in the collapsed mobile row too", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <UnitRosterRow
            unit={ownedMow}
            faction={faction}
            form="expandable"
            testId="row"
          />
        </MemoryRouter>
      </I18nextProvider>
    )

    expect(
      within(screen.getByRole("button")).getByTestId("unit-row-faction")
    ).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveAccessibleName(
      expect.stringMatching(/^Galatian, Ultramarines,/)
    )
  })
})
