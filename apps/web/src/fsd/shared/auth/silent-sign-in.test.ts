import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const attemptSilentSignIn = vi.fn()
const readAccountHint = vi.fn(() => null as unknown)

vi.mock("./authentication", () => ({
  attemptSilentSignIn: (...args: unknown[]) => attemptSilentSignIn(...args),
  readAccountHint: () => readAccountHint(),
}))

let signIn: typeof import("./silent-sign-in")

function instanceWithAccounts(count: number) {
  return {
    getAllAccounts: () => Array.from({ length: count }, (_, index) => index),
  }
}

describe("silent sign-in", () => {
  beforeEach(async () => {
    vi.resetModules()
    signIn = await import("./silent-sign-in")
    attemptSilentSignIn.mockReset()
    readAccountHint.mockReset().mockReturnValue(null)
  })

  it("attempts one restore in a tab with no tokens when the device holds an account hint", () => {
    readAccountHint.mockReturnValue({ homeAccountId: "h", username: "u" })
    attemptSilentSignIn.mockReturnValue(new Promise(() => {}))

    act(() => {
      signIn.startSilentSignInOnce(instanceWithAccounts(0) as never)
      signIn.startSilentSignInOnce(instanceWithAccounts(0) as never)
    })

    expect(attemptSilentSignIn).toHaveBeenCalledOnce()
  })

  it("stays idle and never attempts a silent restore when there is no cached account", () => {
    const { result } = renderHook(() => signIn.useSilentSignInStatus())

    act(() => {
      signIn.startSilentSignInOnce(instanceWithAccounts(0) as never)
    })

    expect(attemptSilentSignIn).not.toHaveBeenCalled()
    expect(result.current).toBe("idle")
  })

  it("flips to checking, then back to idle on a successful restore", async () => {
    let resolveAttempt: (outcome: string) => void = () => {}
    attemptSilentSignIn.mockReturnValue(
      new Promise((resolve) => {
        resolveAttempt = resolve
      })
    )
    const { result } = renderHook(() => signIn.useSilentSignInStatus())

    act(() => {
      signIn.startSilentSignInOnce(instanceWithAccounts(1) as never)
    })

    expect(result.current).toBe("checking")

    await act(async () => {
      resolveAttempt("success")
    })

    await waitFor(() => expect(result.current).toBe("idle"))
  })

  it("flips to checking, then to failed on an unsuccessful restore", async () => {
    attemptSilentSignIn.mockResolvedValue("failed")
    const { result } = renderHook(() => signIn.useSilentSignInStatus())

    act(() => {
      signIn.startSilentSignInOnce(instanceWithAccounts(1) as never)
    })

    await waitFor(() => expect(result.current).toBe("failed"))
  })

  it("only ever attempts a silent restore once, no matter how many times it is triggered", async () => {
    attemptSilentSignIn.mockResolvedValue("failed")

    signIn.startSilentSignInOnce(instanceWithAccounts(1) as never)
    signIn.startSilentSignInOnce(instanceWithAccounts(1) as never)
    signIn.startSilentSignInOnce(instanceWithAccounts(0) as never)

    await waitFor(() => expect(attemptSilentSignIn).toHaveBeenCalledTimes(1))
  })
})
