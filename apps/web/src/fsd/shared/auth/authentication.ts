import {
  AuthError,
  BrowserAuthError,
  BrowserAuthErrorCodes,
  BrowserCacheLocation,
  CacheLookupPolicy,
  EventType,
  InteractionRequiredAuthError,
  LogLevel,
  PublicClientApplication,
  type AuthenticationResult,
  type Configuration,
  type EventMessage,
  type IPublicClientApplication,
  type RedirectRequest,
} from "@azure/msal-browser"

import { getRequiredEnvironmentValue } from "../config/environment"

let authentication: PublicClientApplication | undefined

// How long a hidden prompt=none frame (ssoSilent, or acquireTokenSilent's renewal fallback) may run
// before MSAL gives up with `timed_out`. MSAL's default is 10s, and the frame only times out when it
// cannot complete silently (third-party cookies blocked, the IdP showing a page instead of
// answering) — so the whole wait is dead time before the re-authentication redirect starts. A
// healthy Entra External ID round trip answers in 1-3s; 6s keeps 2x headroom, and a rare false
// timeout costs one seamless redirect rather than a broken session.
export const SILENT_FRAME_TIMEOUT_MS = 6000

function createMsalConfig(): Configuration {
  const authority = getRequiredEnvironmentValue("VITE_MSAL_AUTHORITY")
  const clientId = getRequiredEnvironmentValue("VITE_MSAL_CLIENT_ID")
  const tenantId = getRequiredEnvironmentValue("VITE_MSAL_TENANT_ID")

  return {
    auth: {
      authority,
      clientId,
      knownAuthorities: [
        new URL(authority).origin,
        `https://${tenantId}.ciamlogin.com`,
      ],
      postLogoutRedirectUri: window.location.origin,
      // Points at the MSAL redirect bridge (apps/web/redirect.html), a standalone static page with
      // no app code — required by msal-browser v5 so ssoSilent()/acquireTokenSilent()'s hidden-iframe
      // fallback can broadcast a response back despite Entra's default COOP headers. Used for every
      // interaction type (redirect, silent, iframe fallback), not just interactive sign-in.
      redirectUri: new URL("/redirect.html", window.location.origin).href,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      iframeBridgeTimeout: SILENT_FRAME_TIMEOUT_MS,
      loggerOptions: {
        loggerCallback: (
          level: LogLevel,
          message: string,
          containsPii: boolean
        ) => {
          if (containsPii) {
            return
          }

          switch (level) {
            case LogLevel.Error:
              console.error(message)
              break
            case LogLevel.Warning:
              console.warn(message)
              break
            case LogLevel.Info:
              console.info(message)
              break
            case LogLevel.Verbose:
              console.debug(message)
              break
          }
        },
      },
    },
  }
}

export const loginRequest: RedirectRequest = {
  get scopes() {
    return [getRequiredEnvironmentValue("VITE_API_SCOPE")]
  },
}

export async function initializeAuthentication() {
  const msalInstance = new PublicClientApplication(createMsalConfig())

  await msalInstance.initialize()

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as AuthenticationResult

      msalInstance.setActiveAccount(result.account)
    }
  })

  // The redirect bridge (apps/web/redirect.html) already caches the response and navigates back to
  // where the flow was initiated before this ever runs, so navigateToLoginRequestUrl's default
  // (true) is a no-op safety net here, not a second navigation.
  const redirectResult = await msalInstance.handleRedirectPromise()

  if (redirectResult) {
    msalInstance.setActiveAccount(redirectResult.account)
  }

  if (!msalInstance.getActiveAccount()) {
    const [cachedAccount] = msalInstance.getAllAccounts()

    if (cachedAccount) {
      msalInstance.setActiveAccount(cachedAccount)
    }
  }

  authentication = msalInstance

  return msalInstance
}

class AuthenticationUnavailableError extends Error {
  constructor() {
    super("No authenticated account is available.")
    this.name = "AuthenticationUnavailableError"
  }
}

function getAuthentication() {
  if (!authentication) {
    throw new AuthenticationUnavailableError()
  }

  return authentication
}

function getActiveAccount() {
  const instance = getAuthentication()
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0]

  if (!account) {
    throw new AuthenticationUnavailableError()
  }

  return { account, instance }
}

export async function acquireAccessToken() {
  // The app-load silent restore already does whatever renewal is possible (cache, refresh token,
  // then one hidden frame). Waiting for it keeps the first API call from racing a second hidden
  // frame against it, and once it has failed there is nothing silent left to try: skip the frame
  // so the caller gets an interaction-required error now and can redirect, instead of after
  // another frame timeout.
  const restoreOutcome = await silentRestore
  const { account, instance } = getActiveAccount()
  const result = await instance.acquireTokenSilent({
    account,
    scopes: loginRequest.scopes,
    ...(restoreOutcome === "failed"
      ? { cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken }
      : {}),
  })

  return result.accessToken
}

export function isInteractionRequired(error: unknown) {
  if (error instanceof InteractionRequiredAuthError) {
    return true
  }

  // acquireTokenSilent falls back to a hidden "prompt=none" iframe whenever the cache has no usable
  // refresh token. That iframe can never complete silently when the browser blocks third-party
  // cookies (Safari ITP, Chrome/Firefox privacy modes, etc.) or the IdP session has expired, so it
  // just runs out the clock and MSAL reports a plain timeout rather than InteractionRequiredAuthError.
  // Treat it the same way: only an interactive (redirect) request can resolve it.
  if (
    error instanceof BrowserAuthError &&
    error.errorCode === BrowserAuthErrorCodes.timedOut
  ) {
    return true
  }

  // With the hidden frame skipped (see acquireTokenSilent's cacheLookupPolicy above) a rejected
  // refresh token surfaces as the token endpoint's own `invalid_grant` (e.g. the 24h SPA refresh
  // token lifetime ran out). Only a fresh authorization can replace it.
  return error instanceof AuthError && error.errorCode === "invalid_grant"
}

export function requestApiAccess() {
  const { account, instance } = getActiveAccount()

  return instance.acquireTokenRedirect({
    account,
    scopes: loginRequest.scopes,
  })
}

export type SilentSignInOutcome = "success" | "no-cached-account" | "failed"

// The in-flight (or settled) app-load restore, shared with acquireAccessToken.
let silentRestore: Promise<SilentSignInOutcome> | undefined

export function attemptSilentSignIn(
  instance: IPublicClientApplication
): Promise<SilentSignInOutcome> {
  const restore = restoreSession(instance)
  silentRestore = restore
  return restore
}

async function restoreSession(
  instance: IPublicClientApplication
): Promise<SilentSignInOutcome> {
  const cachedAccount =
    instance.getActiveAccount() ?? instance.getAllAccounts()[0]

  if (!cachedAccount) {
    return "no-cached-account"
  }

  // Cached tokens first: a valid access token or refresh token restores the session with no
  // hidden frame at all, which is the common case for a returning user within the refresh token's
  // lifetime. Only when neither is usable is the IdP session checked through a frame.
  try {
    const result = await instance.acquireTokenSilent({
      ...loginRequest,
      account: cachedAccount,
      cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken,
    })

    instance.setActiveAccount(result.account)

    return "success"
  } catch {
    // Expected once the refresh token has expired; fall through to the IdP session check.
  }

  try {
    // Without an account/sid/loginHint, ssoSilent can't tell which session to restore once more
    // than one account is cached, and fails with an ambiguity error even though a valid session
    // exists for one of them.
    const result = await instance.ssoSilent({
      ...loginRequest,
      account: cachedAccount,
    })

    instance.setActiveAccount(result.account)

    return "success"
  } catch (error) {
    // A rejected/timed-out silent attempt is an expected, common outcome (no live IdP session,
    // third-party storage blocked) and is never surfaced to the user - only log the cases
    // isInteractionRequired() doesn't already account for, since those are genuinely unexpected.
    if (!isInteractionRequired(error)) {
      console.error("[MSAL] silent sign-in failed unexpectedly", error)
    }

    return "failed"
  }
}

// Test-only: forgets the app-load restore so each test starts from a fresh page load.
export function resetSilentRestoreForTesting() {
  silentRestore = undefined
}
