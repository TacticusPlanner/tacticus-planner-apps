import { beforeAll, describe, expect, it } from "vitest"
import type { i18n as I18n } from "i18next"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen, within } from "@/test/render"

import { BattleHeader, BattleWaves } from "./battle-waves"
import { lysanderLane } from "./battles.test-utils"
import type { BattlePreviewViewModel } from "./battles.view-model"

let i18n: I18n
const alpha = lysanderLane("alpha")
const beta = lysanderLane("beta")

const renderBattle = (battle: BattlePreviewViewModel) =>
  render(
    <>
      <BattleHeader battle={battle} />
      <BattleWaves battle={battle} isMobile={false} />
    </>,
    { wrapper: i18nWrapper(i18n) }
  )

describe("BattleWaves", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })

  it("heads Lysander Alpha battle 1 with its power and 32 enemies", () => {
    renderBattle(alpha[0]!)
    expect(screen.getByTestId("battle-title")).toHaveTextContent("Battle 1")
    expect(screen.getByTestId("battle-power")).toHaveTextContent("994")
    expect(screen.getByTestId("battle-enemy-total")).toHaveTextContent(
      "32 enemies"
    )
  })

  it("formats a large power for the UI language", () => {
    renderBattle(alpha[17]!)
    expect(screen.getByTestId("battle-power")).toHaveTextContent("19,836,420")
  })

  it("lists waves by round with their enemy tiles", () => {
    renderBattle(alpha[0]!)
    const [wave1, wave2] = screen.getAllByTestId("battle-wave")
    expect(wave1).toHaveTextContent("Wave 1")
    expect(wave1).toHaveTextContent("Round 1")
    expect(wave1).toHaveTextContent("Power 147")
    const grot = within(wave1!).getByTestId("battle-enemy-tile")
    expect(grot).toHaveTextContent("Grot×7")
    expect(grot).toHaveAccessibleName("Grot, 7, Stone III 1 star")

    expect(wave2).toHaveTextContent("Wave 2")
    expect(wave2).toHaveTextContent("Round 3")
    expect(wave2).toHaveTextContent("Power 132")
    const tiles = within(wave2!).getAllByTestId("battle-enemy-tile")
    expect(tiles.map((tile) => tile.textContent)).toEqual(["Grot×3", "Ork Boy"])
    expect(within(tiles[1]!).queryByTestId("battle-enemy-count")).toBeNull()
  })

  it("labels an enemy past the end of its ladder Level unknown", () => {
    renderBattle(beta[12]!)
    const round3 = screen
      .getAllByTestId("battle-wave")
      .find((wave) => wave.textContent?.includes("Round 3"))!
    const helbrecht = within(round3)
      .getAllByTestId("battle-enemy-tile")
      .find((tile) => tile.dataset.npc === "templBossHelbrecht")!
    expect(helbrecht).toHaveTextContent("Helbrecht")
    expect(helbrecht).toHaveTextContent("Level unknown")
    expect(
      within(round3)
        .getAllByTestId("battle-enemy-tile")
        .filter((tile) => tile !== helbrecht)
        .every((tile) => tile.dataset.level === "resolved")
    ).toBe(true)
  })

  it("renders its copy in German", async () => {
    const german = await createTestI18n("de")
    render(
      <>
        <BattleHeader battle={alpha[17]!} />
        <BattleWaves battle={alpha[0]!} isMobile={false} />
      </>,
      { wrapper: i18nWrapper(german) }
    )
    expect(screen.getByTestId("battle-title")).toHaveTextContent("Kampf 18")
    expect(screen.getByTestId("battle-power")).toHaveTextContent("19.836.420")
    expect(screen.getAllByTestId("battle-wave")[0]).toHaveTextContent("Welle 1")
    expect(screen.getAllByTestId("battle-wave")[0]).toHaveTextContent("Runde 1")
  })

  it("says so for a wave without enemies", () => {
    const battle = alpha[0]!
    renderBattle({
      ...battle,
      waves: [{ number: 1, round: 2, power: 0, enemies: [] }],
    })
    const [wave] = screen.getAllByTestId("battle-wave")
    expect(wave).toHaveTextContent("Round 2")
    expect(within(wave!).getByTestId("battle-wave-empty")).toHaveTextContent(
      "No enemies in this wave"
    )
  })
})
