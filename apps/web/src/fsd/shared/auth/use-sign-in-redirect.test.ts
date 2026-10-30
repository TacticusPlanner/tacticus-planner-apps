import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthError, InteractionStatus } from "@azure/msal-browser"

const loginRedirect = vi.fn()
const inProgress = vi.fn(() => InteractionStatus.None as InteractionStatus)
const silentSignInStatus = vi.fn(() => "idle")
const toastError = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("sonner", () => ({
  toast: { error: (message: string) => toastError(message) },
}))

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({ inProgress: inProgress(), instance: { loginRedirect } }),
}))

const loginRequest = vi.hoisted((): { scopes: string[]; prompt?: string } => ({
  scopes: ["api"],
}))
vi.mock("./authentication", () => ({ loginRequest }))

vi.mock("./silent-sign-in", () => ({
  useSilentSignInStatus: () => silentSignInStatus(),
}))

import { useSignInRedirect } from "./use-sign-in-redirect"

describe("useSignInRedirect", () => {
  beforeEach(() => {
    loginRedirect.mockReset().mockResolvedValue(undefined)
    inProgress.mockReturnValue(InteractionStatus.None)
    silentSignInStatus.mockReturnValue("idle")
    toastError.mockReset()
    delete loginRequest.prompt
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("starts the login redirect with the app's login request", () => {
    window.history.replaceState(null, "", "/privacy")
    const { result } = renderHook(() => useSignInRedirect())

    act(() => result.current.signIn())

    expect(loginRedirect).toHaveBeenCalledWith({ scopes: ["api"] })
    expect(result.current.disabled).toBe(false)
    expect(result.current.checkingSignIn).toBe(false)
  })

  it("returns to Home when sign-in starts from the bare landing page", () => {
    window.history.replaceState(null, "", "/")
    const { result } = renderHook(() => useSignInRedirect())

    act(() => result.current.signIn())

    expect(loginRedirect).toHaveBeenCalledWith({
      scopes: ["api"],
      redirectStartPage: `${window.location.origin}/home`,
    })
  })

  it("returns to the landing page when it carries a preserved destination", () => {
    window.history.replaceState(null, "", "/?next=%2Fplan%2Fgoals")
    const { result } = renderHook(() => useSignInRedirect())

    act(() => result.current.signIn())

    expect(loginRedirect).toHaveBeenCalledWith({ scopes: ["api"] })
    window.history.replaceState(null, "", "/")
  })

  it("is disabled while an MSAL interaction is in progress", () => {
    inProgress.mockReturnValue(InteractionStatus.HandleRedirect)

    const { result } = renderHook(() => useSignInRedirect())

    expect(result.current.disabled).toBe(true)
  })

  it("reports the silent sign-in check", () => {
    silentSignInStatus.mockReturnValue("checking")

    const { result } = renderHook(() => useSignInRedirect())

    expect(result.current.checkingSignIn).toBe(true)
  })

  it("toasts the localized error when the redirect fails", async () => {
    loginRedirect.mockRejectedValue(new AuthError("popup_window_error", "x"))

    const { result } = renderHook(() => useSignInRedirect())
    act(() => result.current.signIn())

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("auth.error"))
  })

  describe("signUp", () => {
    it("opens account creation and returns to Home from the bare landing page", () => {
      window.history.replaceState(null, "", "/")
      const { result } = renderHook(() => useSignInRedirect())

      act(() => result.current.signUp())

      expect(loginRedirect).toHaveBeenCalledWith({
        scopes: ["api"],
        prompt: "create",
        redirectStartPage: `${window.location.origin}/home`,
      })
    })

    it("keeps a preserved destination", () => {
      window.history.replaceState(null, "", "/?next=%2Fgoals")
      const { result } = renderHook(() => useSignInRedirect())

      act(() => result.current.signUp())

      expect(loginRedirect).toHaveBeenCalledWith({
        scopes: ["api"],
        prompt: "create",
      })
      window.history.replaceState(null, "", "/")
    })

    it("asks for account creation even while a fresh login is armed", () => {
      loginRequest.prompt = "login"
      window.history.replaceState(null, "", "/privacy")
      const { result } = renderHook(() => useSignInRedirect())

      act(() => result.current.signUp())

      expect(loginRedirect).toHaveBeenCalledWith({
        scopes: ["api"],
        prompt: "create",
      })
    })

    it("toasts the localized error when the redirect fails", async () => {
      loginRedirect.mockRejectedValue(new Error("blocked"))
      const { result } = renderHook(() => useSignInRedirect())

      act(() => result.current.signUp())

      await waitFor(() => expect(toastError).toHaveBeenCalledWith("auth.error"))
    })
  })
})
