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
  it("opens the widget on click", () => {
    const open = vi.fn()
    useUserJotMock.mockReturnValue({ open, unreadCount: 0 })
    render(<UserJotFeedbackButton />)

    fireEvent.click(screen.getByTestId("userjot-feedback-button"))

    expect(open).toHaveBeenCalledTimes(1)
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
})
