import userEvent from "@testing-library/user-event"
import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type { UpgradeId } from "@workspace/game-domain"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"
import enQuest from "../../../../../../public/locales/en/quest.json"

import { QuestGoalDrops } from "./quest-goal-drops"

let i18n: I18n

describe("QuestGoalDrops", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en", { en: { quest: enQuest } })
  })

  it("lists each needed drop with have / need and opens a battle from its chip", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <QuestGoalDrops
        drops={{
          status: "ready",
          drops: [
            {
              upgradeId: "powerPack" as UpgradeId,
              have: 14,
              need: 24,
              units: ["Maladus", "Dante"],
              battles: [
                { number: 1, numerator: 3, denominator: 4 },
                { number: 9, numerator: 1, denominator: 2 },
              ],
            },
          ],
        }}
        onSelect={onSelect}
        upgradesById={undefined}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getByTestId("quest-goal-drop-have")).toHaveTextContent(
      "14 / 24"
    )
    expect(screen.getByText("Maladus, Dante")).toBeInTheDocument()
    const chips = screen.getAllByTestId("quest-goal-drop-battle")
    expect(chips.map((chip) => chip.textContent)).toEqual([
      "Battle 175%",
      "Battle 950%",
    ])
    await user.click(chips[1]!)
    expect(onSelect).toHaveBeenCalledWith(9)
  })

  it("shows the first five drops and the rest behind Show all", async () => {
    const user = userEvent.setup()
    render(
      <QuestGoalDrops
        drops={{
          status: "ready",
          drops: Array.from({ length: 7 }, (_, index) => ({
            upgradeId: `upgrade${index}` as UpgradeId,
            have: index,
            need: 10,
            units: [],
            battles: [{ number: index + 1, numerator: 1, denominator: 2 }],
          })),
        }}
        onSelect={vi.fn()}
        upgradesById={undefined}
      />,
      { wrapper: i18nWrapper(i18n) }
    )

    expect(screen.getAllByTestId("quest-goal-drop")).toHaveLength(5)
    await user.click(screen.getByRole("button", { name: "Show all 7" }))
    expect(screen.getAllByTestId("quest-goal-drop")).toHaveLength(7)
    await user.click(screen.getByRole("button", { name: "Show fewer" }))
    expect(screen.getAllByTestId("quest-goal-drop")).toHaveLength(5)
  })

  it("says so when no goal needs a drop, and hides without a goal plan", () => {
    const { rerender } = render(
      <QuestGoalDrops
        drops={{ status: "ready", drops: [] }}
        onSelect={vi.fn()}
        upgradesById={undefined}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.getByTestId("quest-goal-drops-empty")).toBeVisible()

    rerender(
      <QuestGoalDrops
        drops={{ status: "hidden" }}
        onSelect={vi.fn()}
        upgradesById={undefined}
      />
    )
    expect(screen.queryByTestId("quest-goal-drops")).toBeNull()
  })
})
