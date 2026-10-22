import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const instance = {
    acquireTokenRedirect: vi.fn(),
    acquireTokenSilent: vi.fn(),
    addEventCallback: vi.fn(),
    loginRedirect: vi.fn(),
    getActiveAccount: vi.fn(),
    getAllAccounts: vi.fn(),
    handleRedirectPromise: vi.fn(),
    initialize: vi.fn(),
    setActiveAccount: vi.fn(),
    ssoSilent: vi.fn(),
  }

  return {
    constructor: vi.fn(),
    environment: vi.fn((name: string) => {
      const values: Record<string, string> = {
        VITE_API_SCOPE: "api://planner/access",
        VITE_MSAL_AUTHORITY: "https://tenant.ciamlogin.com/tenant",
        VITE_MSAL_CLIENT_ID: "client-id",
        VITE_MSAL_TENANT_ID: "tenant",
      }
      return values[name]
    }),
    instance,
  }
})

vi.mock("../config/environment", () => ({
  getRequiredEnvironmentValue: mocks.environment,
}))

// Defined once so the module re-imported per test (see beforeEach) shares these classes.
const errors = vi.hoisted(() => {
  class AuthError extends Error {
    errorCode: string

    constructor(errorCode: string) {
      super(errorCode)
      this.errorCode = errorCode
    }
  }
  class InteractionRequiredAuthError extends AuthError {}
  class BrowserAuthError extends AuthError {}
  return { AuthError, InteractionRequiredAuthError, BrowserAuthError }
})

vi.mock("@azure/msal-browser", () => {
  const { AuthError, BrowserAuthError, InteractionRequiredAuthError } = errors
  class PublicClientApplication {
    constructor(configuration: unknown) {
      mocks.constructor(configuration)
      return mocks.instance as never
    }
  }

  return {
    AuthError,
    BrowserAuthError,
    BrowserAuthErrorCodes: { timedOut: "timed_out" },
    BrowserCacheLocation: {
      LocalStorage: "localStorage",
      SessionStorage: "sessionStorage",
    },
    CacheLookupPolicy: { AccessTokenAndRefreshToken: 1 },
    EventType: { LOGIN_SUCCESS: "login-success" },
    InteractionRequiredAuthError,
    LogLevel: { Error: 0, Warning: 1, Info: 2, Verbose: 3 },
    PublicClientApplication,
  }
})

import {
  AuthError,
  BrowserAuthError,
  InteractionRequiredAuthError,
  LogLevel,
} from "@azure/msal-browser"

let auth: typeof import("./authentication")

describe("authentication", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    auth = await import("./authentication")
    mocks.instance.initialize.mockResolvedValue(undefined)
    mocks.instance.handleRedirectPromise.mockResolvedValue(null)
    mocks.instance.getActiveAccount.mockReturnValue(null)
    mocks.instance.getAllAccounts.mockReturnValue([])
  })

  it("resolves the API scope only when it is accessed", () => {
    expect(auth.loginRequest.scopes).toEqual(["api://planner/access"])
    expect(mocks.environment).toHaveBeenCalledWith("VITE_API_SCOPE")
  })

  it("initializes MSAL and restores a cached account", async () => {
    const cachedAccount = { homeAccountId: "cached" }
    mocks.instance.getAllAccounts.mockReturnValue([cachedAccount] as never)

    await expect(auth.initializeAuthentication()).resolves.toBe(mocks.instance)

    expect(mocks.instance.initialize).toHaveBeenCalledOnce()
    expect(mocks.instance.handleRedirectPromise).toHaveBeenCalledWith()
    expect(mocks.instance.setActiveAccount).toHaveBeenCalledWith(cachedAccount)

    const eventCallback = mocks.instance.addEventCallback.mock.calls[0]?.[0]
    const loggedInAccount = { homeAccountId: "login" }
    eventCallback({
      eventType: "login-success",
      payload: { account: loggedInAccount },
    })
    expect(mocks.instance.setActiveAccount).toHaveBeenCalledWith(
      loggedInAccount
    )
  })

  it("prefers the redirect account and configures logging", async () => {
    const redirectAccount = { homeAccountId: "redirect" }
    mocks.instance.handleRedirectPromise.mockResolvedValue({
      account: redirectAccount,
    })
    mocks.instance.getActiveAccount.mockReturnValue(redirectAccount as never)

    await auth.initializeAuthentication()

    expect(mocks.instance.setActiveAccount).toHaveBeenCalledWith(
      redirectAccount
    )
    const configuration = mocks.constructor.mock.calls.at(-1)?.[0] as {
      system: {
        loggerOptions: {
          loggerCallback: (
            level: number,
            message: string,
            containsPii: boolean
          ) => void
        }
      }
    }
    const logger = configuration.system.loggerOptions.loggerCallback
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined)

    logger(LogLevel.Error, "error", false)
    logger(LogLevel.Warning, "warn", false)
    logger(LogLevel.Info, "info", false)
    logger(LogLevel.Verbose, "debug", false)
    logger(LogLevel.Error, "private", true)

    expect(error).toHaveBeenCalledWith("error")
    expect(warn).toHaveBeenCalledWith("warn")
    expect(info).toHaveBeenCalledWith("info")
    expect(debug).toHaveBeenCalledWith("debug")
    expect(error).not.toHaveBeenCalledWith("private")
  })

  it("acquires and redirects API tokens for the active account", async () => {
    const account = { homeAccountId: "active" }
    mocks.instance.getActiveAccount.mockReturnValue(account as never)
    mocks.instance.acquireTokenSilent.mockResolvedValue({
      accessToken: "token",
    })

    await auth.initializeAuthentication()

    await expect(auth.acquireAccessToken()).resolves.toBe("token")
    expect(mocks.instance.acquireTokenSilent).toHaveBeenCalledWith({
      account,
      scopes: ["api://planner/access"],
    })

    await auth.requestInteraction()
    expect(mocks.instance.acquireTokenRedirect).toHaveBeenCalledWith({
      account,
      scopes: ["api://planner/access"],
    })
  })

  describe("token cache and account hint", () => {
    it("keeps tokens in the tab and removes the pre-deploy localStorage cache once", async () => {
      localStorage.setItem("msal.token.keys.client-id", "[]")
      localStorage.setItem(
        "home-id.tenant-login.windows.net-refreshtoken-client-id--",
        "{}"
      )
      localStorage.setItem("theme", "dark")

      await auth.initializeAuthentication()

      const configuration = mocks.constructor.mock.calls.at(-1)?.[0] as {
        cache: { cacheLocation: string }
      }
      expect(configuration.cache.cacheLocation).toBe("sessionStorage")
      expect(Object.keys(localStorage)).toEqual(["theme"])
    })

    it("stores only the account hint on sign-in, never a token, and forgets it on demand", async () => {
      const account = {
        homeAccountId: "home-id",
        username: "user@example.test",
        idToken: "secret-id-token",
      }
      mocks.instance.handleRedirectPromise.mockResolvedValue({
        account,
        accessToken: "secret-access-token",
      } as never)

      await auth.initializeAuthentication()

      expect(Object.keys(localStorage)).toEqual(["tp.auth.accountHint"])
      expect(JSON.parse(localStorage.getItem("tp.auth.accountHint")!)).toEqual({
        homeAccountId: "home-id",
        username: "user@example.test",
      })
      expect(Object.values(localStorage).join()).not.toMatch(/secret/)

      auth.forgetAccountHint()
      expect(auth.readAccountHint()).toBeNull()
    })
  })

  describe("requestInteraction", () => {
    it("starts one sign-in redirect however many callers ask at once", async () => {
      localStorage.setItem(
        "tp.auth.accountHint",
        JSON.stringify({ homeAccountId: "h", username: "user@example.test" })
      )
      mocks.instance.loginRedirect.mockResolvedValue(undefined)
      await auth.initializeAuthentication()

      await Promise.all([auth.requestInteraction(), auth.requestInteraction()])

      expect(mocks.instance.loginRedirect).toHaveBeenCalledExactlyOnceWith({
        scopes: ["api://planner/access"],
        loginHint: "user@example.test",
      })
    })

    it("lets a later caller retry when starting the redirect failed", async () => {
      mocks.instance.loginRedirect
        .mockRejectedValueOnce(new Error("popup blocked"))
        .mockResolvedValue(undefined)
      await auth.initializeAuthentication()

      await expect(auth.requestInteraction()).rejects.toThrow("popup blocked")
      await auth.requestInteraction()

      expect(mocks.instance.loginRedirect).toHaveBeenCalledTimes(2)
    })
  })

  it("recognizes interaction-required errors", () => {
    expect(
      auth.isInteractionRequired(
        new InteractionRequiredAuthError("interaction_required", "message")
      )
    ).toBe(true)
    expect(auth.isInteractionRequired(new Error("other"))).toBe(false)
  })

  it("caps the hidden sign-in frame wait below MSAL's 10s default", async () => {
    await auth.initializeAuthentication()

    const configuration = mocks.constructor.mock.calls.at(-1)?.[0] as {
      system: { iframeBridgeTimeout: number }
    }
    expect(configuration.system.iframeBridgeTimeout).toBe(
      auth.SILENT_FRAME_TIMEOUT_MS
    )
    expect(auth.SILENT_FRAME_TIMEOUT_MS).toBeLessThan(10_000)
  })

  it("treats a rejected refresh token (invalid_grant) as requiring interaction", () => {
    expect(
      auth.isInteractionRequired(new AuthError("invalid_grant", "message"))
    ).toBe(true)
    expect(
      auth.isInteractionRequired(new AuthError("network_error", "message"))
    ).toBe(false)
  })

  describe("acquireAccessToken after the app-load restore", () => {
    const account = { homeAccountId: "cached" }

    beforeEach(() => {
      mocks.instance.getActiveAccount.mockReturnValue(account as never)
    })

    it("waits for an in-flight restore instead of racing it", async () => {
      let finishRestore: (value: unknown) => void = () => undefined
      mocks.instance.acquireTokenSilent
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              finishRestore = resolve
            })
        )
        .mockResolvedValueOnce({ accessToken: "fresh" })
      await auth.initializeAuthentication()

      const restore = auth.attemptSilentSignIn(mocks.instance as never)
      const token = auth.acquireAccessToken()
      await Promise.resolve()
      expect(mocks.instance.acquireTokenSilent).toHaveBeenCalledTimes(1)

      finishRestore({ account })
      await expect(restore).resolves.toBe("success")
      await expect(token).resolves.toBe("fresh")
      expect(mocks.instance.acquireTokenSilent).toHaveBeenLastCalledWith({
        account,
        scopes: ["api://planner/access"],
      })
    })

    it("skips the hidden frame once the restore has failed, so the caller can redirect at once", async () => {
      const expired = new InteractionRequiredAuthError(
        "refresh_token_expired",
        "message"
      )
      mocks.instance.acquireTokenSilent.mockRejectedValue(expired)
      mocks.instance.ssoSilent.mockRejectedValue(
        new BrowserAuthError("timed_out", "correlation-id")
      )
      await auth.initializeAuthentication()

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("failed")
      await expect(auth.acquireAccessToken()).rejects.toBe(expired)
      expect(mocks.instance.acquireTokenSilent).toHaveBeenLastCalledWith({
        account,
        cacheLookupPolicy: 1,
        scopes: ["api://planner/access"],
      })
      expect(mocks.instance.ssoSilent).toHaveBeenCalledOnce()
    })
  })

  it("treats a silent-iframe timeout as requiring interaction", () => {
    expect(
      auth.isInteractionRequired(
        new BrowserAuthError("timed_out", "correlation-id")
      )
    ).toBe(true)
    expect(
      auth.isInteractionRequired(
        new BrowserAuthError("popup_window_error", "correlation-id")
      )
    ).toBe(false)
  })

  describe("attemptSilentSignIn", () => {
    beforeEach(() => {
      // No usable cached token by default, so the IdP session check is what's exercised.
      mocks.instance.acquireTokenSilent.mockRejectedValue(
        new InteractionRequiredAuthError("refresh_token_expired", "message")
      )
    })

    it("restores from cached tokens without a hidden frame when they are usable", async () => {
      const cachedAccount = { homeAccountId: "cached" }
      mocks.instance.getAllAccounts.mockReturnValue([cachedAccount] as never)
      mocks.instance.acquireTokenSilent.mockResolvedValue({
        account: cachedAccount,
      })

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("success")
      expect(mocks.instance.acquireTokenSilent).toHaveBeenCalledWith({
        account: cachedAccount,
        cacheLookupPolicy: 1,
        scopes: ["api://planner/access"],
      })
      expect(mocks.instance.ssoSilent).not.toHaveBeenCalled()
      expect(mocks.instance.setActiveAccount).toHaveBeenCalledWith(
        cachedAccount
      )
    })

    it("runs one hidden check with the account hint when the tab holds no account", async () => {
      localStorage.setItem(
        "tp.auth.accountHint",
        JSON.stringify({ homeAccountId: "h", username: "user@example.test" })
      )
      mocks.instance.getAllAccounts.mockReturnValue([])
      const restored = { homeAccountId: "h", username: "user@example.test" }
      mocks.instance.ssoSilent.mockResolvedValue({ account: restored })

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("success")
      expect(mocks.instance.ssoSilent).toHaveBeenCalledExactlyOnceWith({
        scopes: ["api://planner/access"],
        loginHint: "user@example.test",
      })
      expect(mocks.instance.setActiveAccount).toHaveBeenCalledWith(restored)
    })

    it("does not call ssoSilent when there is no cached account and no hint", async () => {
      mocks.instance.getAllAccounts.mockReturnValue([])

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("no-cached-account")
      expect(mocks.instance.ssoSilent).not.toHaveBeenCalled()
    })

    it("activates the restored account on success", async () => {
      const cachedAccount = { homeAccountId: "cached" }
      const restoredAccount = { homeAccountId: "restored" }
      mocks.instance.getAllAccounts.mockReturnValue([cachedAccount] as never)
      mocks.instance.ssoSilent.mockResolvedValue({ account: restoredAccount })

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("success")
      expect(mocks.instance.ssoSilent).toHaveBeenCalledWith({
        account: cachedAccount,
        scopes: ["api://planner/access"],
      })
      expect(mocks.instance.setActiveAccount).toHaveBeenCalledWith(
        restoredAccount
      )
    })

    it("fails silently, without logging, on an interaction-required error", async () => {
      mocks.instance.getAllAccounts.mockReturnValue([
        { homeAccountId: "cached" },
      ] as never)
      mocks.instance.ssoSilent.mockRejectedValue(
        new InteractionRequiredAuthError("interaction_required", "message")
      )
      const error = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined)

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("failed")
      expect(error).not.toHaveBeenCalled()
    })

    it("fails silently, without logging, on a silent-iframe timeout", async () => {
      mocks.instance.getAllAccounts.mockReturnValue([
        { homeAccountId: "cached" },
      ] as never)
      mocks.instance.ssoSilent.mockRejectedValue(
        new BrowserAuthError("timed_out", "correlation-id")
      )
      const error = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined)

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("failed")
      expect(error).not.toHaveBeenCalled()
    })

    it("fails silently but logs an unexpected error", async () => {
      mocks.instance.getAllAccounts.mockReturnValue([
        { homeAccountId: "cached" },
      ] as never)
      mocks.instance.ssoSilent.mockRejectedValue(new Error("boom"))
      const error = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined)

      await expect(
        auth.attemptSilentSignIn(mocks.instance as never)
      ).resolves.toBe("failed")
      expect(error).toHaveBeenCalledWith(
        "[MSAL] silent sign-in failed unexpectedly",
        expect.any(Error)
      )
    })
  })
})
