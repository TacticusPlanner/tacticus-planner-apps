import { StrictMode, type ReactNode } from "react"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  takeSignInRedirectFailure: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("sonner", () => ({
  toast: { error: (message: string) => mocks.toastError(message) },
}))

vi.mock("@azure/msal-react", () => ({
  MsalProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock("@/shared/auth", () => ({
  startSilentSignInOnce: vi.fn(),
  takeSignInRedirectFailure: mocks.takeSignInRedirectFailure,
}))

import { AuthProvider } from "./auth-provider"

function renderProvider(outcome: "cancelled" | "failed" | null) {
  // One-shot, like the real one.
  let pending = outcome
  mocks.takeSignInRedirectFailure.mockImplementation(() => {
    const value = pending
    pending = null
    return value
  })
  render(
    <StrictMode>
      <AuthProvider instance={{} as never}>
        <p>app</p>
      </AuthProvider>
    </StrictMode>
  )
}

describe("AuthProvider sign-in redirect failure toast", () => {
  beforeEach(() => {
    mocks.toastError.mockReset()
  })

  it("shows the authentication error exactly once for a failed redirect, under StrictMode", () => {
    renderProvider("failed")

    expect(mocks.toastError).toHaveBeenCalledExactlyOnceWith("auth.error")
  })

  it.each(["cancelled", null] as const)("shows nothing for %s", (outcome) => {
    renderProvider(outcome)

    expect(mocks.toastError).not.toHaveBeenCalled()
  })
})
