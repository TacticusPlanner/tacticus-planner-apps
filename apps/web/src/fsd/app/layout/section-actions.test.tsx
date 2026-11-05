import type { i18n as I18n } from "i18next"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen } from "@/test/render"

import type { NavItem } from "./nav-items"
import { SectionActions } from "./section-actions"

const signedIn = vi.hoisted(() => ({ value: true }))
vi.mock("@azure/msal-react", () => ({
  useIsAuthenticated: () => signedIn.value,
}))
const save = vi.hoisted(() => vi.fn())
vi.mock("@/entities/planning-setting", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/planning-setting")>()),
  usePlanningSettings: () => ({
    settings: {
      dailyEnergy: 288,
      xpBookRarity: "Legendary",
      preferences: [],
      revision: 1,
    },
    loading: false,
    save,
  }),
}))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: vi.fn() }),
}))

let i18n: I18n
const item = (path: string) => ({ path }) as NavItem
const renderActions = (path: string) =>
  render(<SectionActions item={item(path)} />, {
    wrapper: i18nWrapper(i18n),
  })

describe("SectionActions", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    signedIn.value = true
    save.mockReset().mockResolvedValue(undefined)
  })

  it("loads the Legendary Event settings on its section and saves Show paid options as a flag", async () => {
    renderActions("/legendary-events")

    fireEvent.click(await screen.findByTestId("legendary-event-settings"))
    expect(
      screen.getByTestId("legendary-event-settings-dialog")
    ).toHaveTextContent("Legendary Event settings")
    fireEvent.click(screen.getByTestId("legendary-event-settings-paid"))

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        preferences: ["LegendaryEventShowPaidOptions"],
      })
    )
  })

  it("shows nothing on another section", () => {
    const { container } = renderActions("/library")
    expect(container).toBeEmptyDOMElement()
  })

  it("shows no settings while signed out", async () => {
    signedIn.value = false
    const { container } = renderActions("/legendary-events")
    // Let the lazy button load before checking it rendered nothing.
    await import("@/features/legendary-event-plan")
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByTestId("legendary-event-settings")).toBeNull()
    expect(container).toBeEmptyDOMElement()
  })
})
