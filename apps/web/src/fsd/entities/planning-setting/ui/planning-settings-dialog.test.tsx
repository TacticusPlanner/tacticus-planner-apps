import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const save = vi.fn()
const onOpenChange = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/entities/planning-setting", () => ({
  dailyEnergyTiers: [288, 378, 438, 538, 638, 738, 838, 938],
  xpBookRarityOptions: [
    "Common",
    "Uncommon",
    "Rare",
    "Epic",
    "Legendary",
    "Mythic",
  ],
  normalizeXpBookRarity: (rarity: string | null | undefined) =>
    rarity &&
    ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"].includes(
      rarity
    )
      ? rarity
      : "Legendary",
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 538, xpBookRarity: "Epic", revision: 7 },
    save,
  }),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
}))

import { PlanningSettingsDialog } from "./planning-settings-dialog"

describe("PlanningSettingsDialog", () => {
  beforeEach(() => {
    save.mockReset().mockResolvedValue(undefined)
    onOpenChange.mockReset()
  })

  it("loads synchronized energy and rarity, and saves with the current revision", async () => {
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    expect(
      screen.getByTestId("planning-settings-energy-value")
    ).toHaveTextContent("538 · 50 BS")
    expect(
      screen.getByTestId("planning-settings-xp-book-rarity")
    ).toHaveTextContent("progression:rarities.Epic")
    fireEvent.click(screen.getByTestId("planning-settings-save"))

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith({
        dailyEnergy: 538,
        xpBookRarity: "Epic",
        revision: 7,
      })
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("saves the newly selected XP-book rarity", async () => {
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByTestId("planning-settings-xp-book-rarity"))
    fireEvent.click(
      within(await screen.findByRole("listbox")).getByText(
        "progression:rarities.Legendary"
      )
    )
    fireEvent.click(screen.getByTestId("planning-settings-save"))

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith({
        dailyEnergy: 538,
        xpBookRarity: "Legendary",
        revision: 7,
      })
    })
  })

  it("keeps the dialog open and displays a failed save", async () => {
    save.mockRejectedValue(new Error("network"))
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByTestId("planning-settings-save"))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "goals.planningSettings.error"
    )
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
