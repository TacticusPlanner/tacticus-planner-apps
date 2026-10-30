import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const toastError = vi.fn()

vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

import {
  rememberSignInAccountKept,
  useSignInAccountKeptNotice,
} from "./sign-in-account-kept-notice"

describe("sign-in account kept notice", () => {
  beforeEach(() => {
    sessionStorage.clear()
    toastError.mockClear()
  })

  it("shows the remembered notice once, then forgets it", () => {
    rememberSignInAccountKept()

    renderHook(() => useSignInAccountKeptNotice())
    renderHook(() => useSignInAccountKeptNotice())

    expect(toastError).toHaveBeenCalledOnce()
    expect(toastError).toHaveBeenCalledWith(
      "manageAccount.account.signInAccountKeptTitle",
      expect.objectContaining({
        description: "manageAccount.account.signInAccountKeptDescription",
      })
    )
  })

  it("shows nothing when no purge left a notice", () => {
    renderHook(() => useSignInAccountKeptNotice())

    expect(toastError).not.toHaveBeenCalled()
  })

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("blocked")
    })

    expect(() => rememberSignInAccountKept()).not.toThrow()
    renderHook(() => useSignInAccountKeptNotice())
    expect(toastError).not.toHaveBeenCalled()
  })
})
