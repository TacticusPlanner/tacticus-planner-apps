import { render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

const recordInterest = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock("../model/xp-income-feature-interest", () => ({
  xpIncomeFeatureInterest: {
    eventName: "feature_interest_submitted",
    featureId: "xp_income",
  },
  recordXpIncomeFeatureInterest: (...args: unknown[]) =>
    recordInterest(...args),
}))

import { XpIncomePlaceholderPage } from "./xp-income-placeholder-page"

describe("XpIncomePlaceholderPage", () => {
  it("records interest once per mount and shows an accessible acknowledgement", async () => {
    const user = userEvent.setup()
    render(<XpIncomePlaceholderPage />)

    expect(screen.getByTestId("xp-income-placeholder-page")).toBeInTheDocument()
    expect(screen.getByAltText("progress.xpIncome.bookAlt")).toHaveAttribute(
      "src",
      "/game_catalog/books/ui_icon_consumable_xp_book_4.png"
    )

    const button = screen.getByRole("button", {
      name: "progress.xpIncome.interestButton",
    })
    await user.click(button)

    expect(recordInterest).toHaveBeenCalledOnce()
    expect(recordInterest).toHaveBeenCalledWith({
      eventName: "feature_interest_submitted",
      featureId: "xp_income",
    })
    expect(
      screen.getByRole("button", {
        name: "progress.xpIncome.interestRecorded",
      })
    ).toBeDisabled()
    expect(
      screen.getByText("progress.xpIncome.interestAcknowledgement")
    ).toBeInTheDocument()

    await user.click(button)
    expect(recordInterest).toHaveBeenCalledOnce()
  })
})
