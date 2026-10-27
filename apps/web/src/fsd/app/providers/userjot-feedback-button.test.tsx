import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const useUserJotMock = vi.fn()

vi.mock("./userjot-provider", () => ({
  useUserJot: () => useUserJotMock(),
}))

import { UserJotFeedbackButton } from "./userjot-feedback-button"

describe("UserJotFeedbackButton", () => {
  it("opens the widget's default view on click when there is no unread activity", () => {
    const open = vi.fn()
    useUserJotMock.mockReturnValue({ open, unreadCount: 0 })
    render(<UserJotFeedbackButton />)

    const button = screen.getByTestId("userjot-feedback-button")
    expect(button).toHaveAccessibleName("feedback.button")
    fireEvent.click(button)

    expect(open).toHaveBeenCalledWith()
  })

  it("opens the Changelog on click while there is unread activity, so it can be read and cleared", () => {
    const open = vi.fn()
    useUserJotMock.mockReturnValue({ open, unreadCount: 1 })
    render(<UserJotFeedbackButton />)

    const button = screen.getByTestId("userjot-feedback-button")
    expect(button).toHaveAccessibleName("feedback.changelog")
    fireEvent.click(button)

    expect(open).toHaveBeenCalledWith({ to: "updates" })
  })

  it("shows no unread indicator when there is no unread activity", () => {
    useUserJotMock.mockReturnValue({ open: vi.fn(), unreadCount: 0 })
    render(<UserJotFeedbackButton />)

    expect(
      screen.queryByTestId("userjot-feedback-unread-indicator")
    ).not.toBeInTheDocument()
  })

  it("shows an unread indicator when the widget reports unread activity", () => {
    useUserJotMock.mockReturnValue({ open: vi.fn(), unreadCount: 3 })
    render(<UserJotFeedbackButton />)

    expect(
      screen.getByTestId("userjot-feedback-unread-indicator")
    ).toBeInTheDocument()
  })

  it("is disabled with an explanation when the widget failed to load", () => {
    useUserJotMock.mockReturnValue({
      open: vi.fn(),
      unreadCount: 0,
      status: "failed",
    })
    render(<UserJotFeedbackButton />)

    const button = screen.getByTestId("userjot-feedback-button")
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute(
      "title",
      "nav.quickActions.feedbackUnavailable"
    )
  })
})
