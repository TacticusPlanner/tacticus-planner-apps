import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/app/providers", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const signOut = vi.fn<(instance: unknown, accountId: string) => Promise<void>>(
  () => Promise.resolve()
)
const activeAccountId = vi.fn<() => string | undefined>(() => "home-account-1")

vi.mock("@/shared/auth", () => ({
  signOut: (instance: unknown, accountId: string) =>
    signOut(instance, accountId),
  useActiveAccountId: () => activeAccountId(),
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ instance: { id: "msal-instance" } }),
}))

import { AccountSetupLayout } from "./account-setup-layout"

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/setup"]}>
      <Routes>
        <Route element={<AccountSetupLayout />} path="/setup">
          <Route index element={<div data-testid="setup-outlet" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("AccountSetupLayout", () => {
  beforeEach(() => {
    signOut.mockClear()
    activeAccountId.mockReturnValue("home-account-1")
  })

  it("renders the routed step content", () => {
    renderLayout()
    expect(screen.getByTestId("setup-outlet")).toBeVisible()
  })

  it("shows sign out in the header, not as a footer on the screen content", () => {
    renderLayout()

    const header = screen.getByRole("banner")
    expect(screen.getByTestId("account-setup-sign-out")).toBeVisible()
    expect(header).toContainElement(
      screen.getByTestId("account-setup-sign-out")
    )
  })

  it("signs the user out with the active account", () => {
    renderLayout()

    fireEvent.click(screen.getByTestId("account-setup-sign-out"))

    expect(signOut).toHaveBeenCalledWith(
      { id: "msal-instance" },
      "home-account-1"
    )
  })

  it("disables sign out without an active account", () => {
    activeAccountId.mockReturnValue(undefined)
    renderLayout()

    expect(screen.getByTestId("account-setup-sign-out")).toBeDisabled()
  })
})
