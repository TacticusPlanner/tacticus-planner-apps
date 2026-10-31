import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}))

import { BetaPromoTile } from "./beta-promo-tile"

describe("BetaPromoTile", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 10, 1), toFake: ["Date"] })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it("shows the code and copies it", async () => {
    const user = userEvent.setup()
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue()
    render(<BetaPromoTile />)

    expect(screen.getByTestId("home-beta-promo-code")).toHaveTextContent(
      "NEWPLANNERAMMUS"
    )
    await user.click(
      screen.getByRole("button", { name: "home.betaPromo.copy" })
    )

    expect(writeText).toHaveBeenCalledWith("NEWPLANNERAMMUS")
    expect(
      screen.getByRole("button", { name: "home.betaPromo.copied" })
    ).toBeVisible()
  })

  it("hides for good once dismissed", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<BetaPromoTile />)

    await user.click(
      screen.getByRole("button", { name: "home.betaPromo.dismiss" })
    )
    expect(screen.queryByTestId("home-beta-promo")).toBeNull()

    unmount()
    render(<BetaPromoTile />)
    expect(screen.queryByTestId("home-beta-promo")).toBeNull()
  })

  it("is gone once the code has expired", () => {
    vi.setSystemTime(new Date(2026, 10, 8))
    render(<BetaPromoTile />)
    expect(screen.queryByTestId("home-beta-promo")).toBeNull()
  })
})
