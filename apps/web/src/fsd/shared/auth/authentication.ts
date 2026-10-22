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
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
  type EventMessage,
  type IPublicClientApplication,
  type RedirectRequest,
} from "@azure/msal-browser"

import { getRequiredEnvironmentValue } from "../config/environment"
import { safeStorage } from "@/shared/lib"

let authentication: PublicClientApplication | undefined

// How long a hidden prompt=none frame (ssoSilent, or acquireTokenSilent's renewal fallback) may run
// before MSAL gives up with `timed_out`. MSAL's default is 10s, and the frame only times out when it
// cannot complete silently (third-party cookies blocked, the IdP showing a page instead of
// answering) — so the whole wait is dead time before the re-authentication redirect starts. A
// healthy Entra External ID round trip answers in 1-3s; 6s keeps 2x headroom, and a rare false
// timeout costs one seamless redirect rather than a broken session.
export const SILENT_FRAME_TIMEOUT_MS = 6000

// The one thing about the session kept on the device (spec: silent-sign-in): which account to
// restore, never a token. Tokens live in the tab's sessionStorage.
const ACCOUNT_HINT_KEY = "tp.auth.accountHint"

type AccountHint = { homeAccountId: string; username: string }

export function readAccountHint(): AccountHint | null {
  try {
    const hint: unknown = JSON.parse(
      safeStorage.get(ACCOUNT_HINT_KEY) ?? "null"
    )
    return hint &&
      typeof hint === "object" &&
      typeof (hint as AccountHint).homeAccountId === "string" &&
      typeof (hint as AccountHint).username === "string"
      ? (hint as AccountHint)
      : null
  } catch {
    return null
  }
}

export function forgetAccountHint() {
  safeStorage.remove(ACCOUNT_HINT_KEY)
}

function activateAccount(
  instance: IPublicClientApplication,
  account: AccountInfo | null
) {
  instance.setActiveAccount(account)
  if (account) {
    const hint: AccountHint = {
      homeAccountId: account.homeAccountId,
      username: account.username,
    }
    safeStorage.set(ACCOUNT_HINT_KEY, JSON.stringify(hint))
  }
}

// Tokens used to be cached in localStorage. Once, before MSAL starts, drop that cache: every key MSAL
// owned there starts with `msal.` or contains the client id (`<homeAccountId>-<env>-<type>-<clientId>-…`).
function removeLegacyTokenCache(clientId: string) {
  try {
    const storage = window.localStorage
    const legacy: string[] = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key && (key.startsWith("msal.") || key.includes(clientId))) {
        legacy.push(key)
      }
    }
    legacy.forEach((key) => storage.removeItem(key))
  } catch {
    // Storage blocked: there is no legacy cache to remove either.
  }
}

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
      // Tab-scoped (spec: redirect-authentication); new tabs restore through the account hint.
      cacheLocation: BrowserCacheLocation.SessionStorage,
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
  removeLegacyTokenCache(getRequiredEnvironmentValue("VITE_MSAL_CLIENT_ID"))
  const msalInstance = new PublicClientApplication(createMsalConfig())

  await msalInstance.initialize()

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as AuthenticationResult

      activateAccount(msalInstance, result.account)
    }
  })

  // The redirect bridge (apps/web/redirect.html) already caches the response and navigates back to
  // where the flow was initiated before this ever runs, so navigateToLoginRequestUrl's default
  // (true) is a no-op safety net here, not a second navigation.
  const redirectResult = await msalInstance.handleRedirectPromise()

  if (redirectResult) {
    activateAccount(msalInstance, redirectResult.account)
  }

  if (!msalInstance.getActiveAccount()) {
    const [cachedAccount] = msalInstance.getAllAccounts()

    if (cachedAccount) {
      activateAccount(msalInstance, cachedAccount)
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

// One interactive redirect per page load (spec: redirect-authentication): the API request handler,
// the player-data sync and any other caller join the first one. Cleared only when starting it failed,
// so a caller can retry; a started redirect is leaving the page.
let interaction: Promise<void> | null = null

export function requestInteraction(): Promise<void> {
  if (interaction) return interaction
  const request = Promise.resolve().then(startInteraction)
  interaction = request
  request.catch(() => {
    if (interaction === request) interaction = null
  })
  return request
}

function startInteraction() {
  const instance = getAuthentication()
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0]
  if (account) {
    return instance.acquireTokenRedirect({
      account,
      scopes: loginRequest.scopes,
    })
  }
  const hint = readAccountHint()
  return instance.loginRedirect({
    scopes: loginRequest.scopes,
    ...(hint ? { loginHint: hint.username } : {}),
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
    // A new tab or a restarted browser holds no tokens; the account hint says whose IdP session
    // to check.
    const hint = readAccountHint()
    return hint
      ? checkIdentityProviderSession(instance, { loginHint: hint.username })
      : "no-cached-account"
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

    activateAccount(instance, result.account)

    return "success"
  } catch {
    // Expected once the refresh token has expired; fall through to the IdP session check.
  }

  // Without an account/sid/loginHint, ssoSilent can't tell which session to restore once more
  // than one account is cached, and fails with an ambiguity error even though a valid session
  // exists for one of them.
  return checkIdentityProviderSession(instance, { account: cachedAccount })
}

/** One hidden IdP session check (bounded by SILENT_FRAME_TIMEOUT_MS). */
async function checkIdentityProviderSession(
  instance: IPublicClientApplication,
  who: { account: AccountInfo } | { loginHint: string }
): Promise<SilentSignInOutcome> {
  try {
    const result = await instance.ssoSilent({ ...loginRequest, ...who })

    activateAccount(instance, result.account)

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
