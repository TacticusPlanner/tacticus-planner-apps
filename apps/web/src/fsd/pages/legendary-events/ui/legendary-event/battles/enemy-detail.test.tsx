import { MemoryRouter } from "react-router"
import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"
import libraryEn from "../../../../../../../public/locales/en/library.json"

import { lysanderLane } from "./battles.test-utils"
import type { EnemyTileViewModel } from "./battles.view-model"
import { EnemyTile } from "./enemy-tile"

let i18n: I18n
const grotTile = lysanderLane("alpha")[0]!.waves[0]!.enemies[0]!
const helbrechtTile = lysanderLane("beta")[12]!
  .waves.find((wave) => wave.round === 3)!
  .enemies.find((tile) => tile.npcId === "templBossHelbrecht")!

function renderTile(tile: EnemyTileViewModel, isMobile: boolean) {
  setViewportWidth(isMobile ? 390 : 1280)
  return render(
    <MemoryRouter>
      <EnemyTile isMobile={isMobile} tile={tile} />
    </MemoryRouter>,
    { wrapper: i18nWrapper(i18n) }
  )
}

describe("EnemyTile details", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en", { en: { library: libraryEn } })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("opens a popover with Grot's stats and its Library link on desktop", async () => {
    const user = userEvent.setup()
    renderTile(grotTile, false)
    await user.click(screen.getByTestId("battle-enemy-tile"))

    const popover = await screen.findByTestId("battle-enemy-popover")
    expect(within(popover).getByText("Grot")).toBeInTheDocument()
    expect(within(popover).getByText("Orks")).toBeInTheDocument()
    expect(within(popover).getByAltText("Stone III")).toBeInTheDocument()
    expect(
      within(popover).getByTestId("npc-stat-summary-health")
    ).toHaveTextContent("69")
    expect(
      within(popover).getByTestId("npc-stat-summary-damage")
    ).toHaveTextContent("35")
    expect(
      within(popover).getByTestId("npc-stat-summary-armour")
    ).toHaveTextContent("0")
    expect(
      within(popover).getByTestId("battle-enemy-library-link")
    ).toHaveAttribute(
      "href",
      "/library/npcs/grot?variation=orksNpc1Grot&level=3"
    )
  })

  it("opens a bottom sheet on mobile and returns focus to the tile on close", async () => {
    const user = userEvent.setup()
    renderTile(grotTile, true)
    const tile = screen.getByTestId("battle-enemy-tile")
    await user.click(tile)

    const sheet = await screen.findByTestId("battle-enemy-sheet")
    expect(
      within(sheet).getByTestId("npc-stat-summary-health")
    ).toHaveTextContent("69")
    expect(
      within(sheet).getByTestId("battle-enemy-library-link")
    ).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByTestId("battle-enemy-sheet")).toBeNull()
    expect(tile).toHaveFocus()
  })

  it("shows stats but no Library link for a variation the Library does not list", async () => {
    const user = userEvent.setup()
    renderTile({ ...grotTile, libraryHref: undefined }, false)
    await user.click(screen.getByTestId("battle-enemy-tile"))

    const popover = await screen.findByTestId("battle-enemy-popover")
    expect(
      within(popover).getByTestId("npc-stat-summary-health")
    ).toBeInTheDocument()
    expect(
      within(popover).queryByTestId("battle-enemy-library-link")
    ).toBeNull()
  })

  it("shows no stats for an unresolved level", async () => {
    const user = userEvent.setup()
    renderTile(helbrechtTile, false)
    await user.click(screen.getByTestId("battle-enemy-tile"))

    const popover = await screen.findByTestId("battle-enemy-popover")
    expect(within(popover).getByText("Helbrecht")).toBeInTheDocument()
    expect(
      within(popover).getByTestId("battle-enemy-level-unknown")
    ).toHaveTextContent("Level unknown")
    expect(within(popover).queryByTestId("npc-stat-summary-stats")).toBeNull()
    expect(
      within(popover).queryByTestId("battle-enemy-library-link")
    ).toBeNull()
  })
})
