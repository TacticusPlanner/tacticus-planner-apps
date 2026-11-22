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
const settings = vi.hoisted(() => ({
  dailyEnergy: 538,
  xpBookRarity: "Epic",
  revision: 7,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// The real xpBookRarityOptions / normalizeXpBookRarity; only the settings query is stubbed.
vi.mock("../model/use-planning-settings", () => ({
  usePlanningSettings: () => ({
    settings,
    save,
  }),
}))

vi.mock("@/shared/local-data", async () => {
  const { globalValuesFixture } =
    await import("@workspace/game-catalog/testing")
  return {
    useCatalogDataset: (
      _key: string,
      select: (records: unknown[]) => unknown
    ) => ({ status: "ready", data: select([globalValuesFixture]) }),
  }
})

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
}))

import { PlanningSettingsDialog } from "./planning-settings-dialog"

describe("PlanningSettingsDialog", () => {
  beforeEach(() => {
    save
      .mockReset()
      .mockImplementation((next: typeof settings) =>
        Promise.resolve({ ...next, revision: next.revision + 1 })
      )
    onOpenChange.mockReset()
    settings.dailyEnergy = 538
  })

  const pickRarity = async (rarity: string) => {
    fireEvent.click(screen.getByTestId("planning-settings-xp-book-rarity"))
    fireEvent.click(
      within(await screen.findByRole("listbox")).getByText(
        `progression:rarities.${rarity}`
      )
    )
  }

  it("shows the synchronized energy and rarity and saves nothing on open", () => {
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    expect(
      screen.getByTestId("planning-settings-energy-value")
    ).toHaveTextContent("538 · 50 BS")
    expect(
      screen.getByTestId("planning-settings-xp-book-rarity")
    ).toHaveTextContent("progression:rarities.Epic")
    expect(save).not.toHaveBeenCalled()
  })

  it("saves a new XP-book rarity as soon as it is picked", async () => {
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    await pickRarity("Legendary")

    await waitFor(() => {
      expect(save).toHaveBeenCalledWith({
        dailyEnergy: 538,
        xpBookRarity: "Legendary",
        revision: 7,
      })
    })
  })

  it("saves a released energy step with the rarity picked before it", async () => {
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    await pickRarity("Legendary")
    const thumb = screen.getByRole("slider")
    fireEvent.keyDown(thumb, { key: "ArrowRight" })

    await waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    // The second write sends the revision the first one returned.
    expect(save).toHaveBeenLastCalledWith(
      expect.objectContaining({ xpBookRarity: "Legendary", revision: 8 })
    )
    expect(save.mock.lastCall?.[0].dailyEnergy).not.toBe(538)
  })

  it("has one Done button that closes without saving", () => {
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    expect(
      screen.queryByText("goals.planningSettings.cancel")
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("planning-settings-done"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(save).not.toHaveBeenCalled()
  })

  it("displays a failed save and clears it on the next change", async () => {
    save.mockRejectedValueOnce(new Error("network"))
    render(<PlanningSettingsDialog open onOpenChange={onOpenChange} />)

    await pickRarity("Legendary")
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "goals.planningSettings.error"
    )

    await pickRarity("Mythic")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    await waitFor(() => {
      expect(save).toHaveBeenLastCalledWith(
        expect.objectContaining({ xpBookRarity: "Mythic", revision: 7 })
      )
    })
  })
})
