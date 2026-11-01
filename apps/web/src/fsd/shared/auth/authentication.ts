import {
  AuthError,
  BrowserAuthError,
  BrowserAuthErrorCodes,
  BrowserCacheLocation,
  CacheLookupPolicy,
  EventType,
  InteractionRequiredAuthError,
  InteractionType,
  LogLevel,
  PromptValue,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
  type EventMessage,
  type IPublicClientApplication,
  type RedirectRequest,
} from "@azure/msal-browser"

import { getRequiredEnvironmentValue } from "../config/environment"
import { getSignInMethod, type SignInMethod } from "./account-identity"
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
// restore, kept apart from MSAL's own token cache so it survives that cache being cleared.
const ACCOUNT_HINT_KEY = "tp.auth.accountHint"

// `signInMethod` is absent on hints written before it existed; those are treated as unknown.
type AccountHint = {
  homeAccountId: string
  username: string
  signInMethod?: SignInMethod
}

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

export function hasAccountHint() {
  return readAccountHint() !== null
}

// Entra names a federated user `<object id>@<tenant domain>`; a local account's username is the
// address they typed. Used for hints stored before `signInMethod` was recorded.
const GENERATED_USERNAME = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}@/i

function hintSignInMethod(hint: AccountHint): SignInMethod {
  return (
    hint.signInMethod ??
    (GENERATED_USERNAME.test(hint.username) ? "google" : "email")
  )
}

export function forgetAccountHint() {
  safeStorage.remove(ACCOUNT_HINT_KEY)
}

// Armed when an interactive sign-in comes back with an error (spec: redirect-authentication): the
// identity provider may be answering from a session we can't use (in production, one whose account
// was deleted on another device), so the next interactive flow asks for a fresh login instead.
// Kept in localStorage like the hint, so a new tab doesn't spend another failing round trip.
const FRESH_LOGIN_KEY = "tp.auth.freshLogin"

export function forgetFreshLogin() {
  safeStorage.remove(FRESH_LOGIN_KEY)
}

function freshLoginPrompt(): { prompt?: string } {
  return safeStorage.get(FRESH_LOGIN_KEY) ? { prompt: PromptValue.LOGIN } : {}
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
      signInMethod: getSignInMethod(account),
    }
    safeStorage.set(ACCOUNT_HINT_KEY, JSON.stringify(hint))
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
      // Device-scoped (spec: redirect-authentication): a relaunched installed app or a new tab
      // restores from the cached refresh token, with no hidden frame, which the installed app on
      // Android often cannot complete. Signing out clears it.
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
  // `email` is the OpenID scope that lets Entra put the `email` optional claim in the ID token; MSAL only adds
  // openid/profile/offline_access on its own.
  get scopes() {
    return [getRequiredEnvironmentValue("VITE_API_SCOPE"), "email"]
  },
  // Read when a caller spreads the request (at click time), so every sign-in button picks it up.
  get prompt() {
    return freshLoginPrompt().prompt
  },
}

// Sign-in from the bare landing page asks to come back to /home (see use-sign-in-redirect), but the
// redirect bridge falls back to the site root whenever it cannot read where the flow started. The
// landing page stays browsable once signed in (spec: landing-page), so a sign-in that completes on a
// bare "/" is moved on to Home here, before the router reads the address.
function returnHomeAfterLandingSignIn() {
  const { pathname, search, hash } = window.location
  if (pathname === "/" && search === "" && hash === "") {
    window.history.replaceState(window.history.state, "", "/home")
  }
}

export type SignInRedirectFailure = "cancelled" | "failed"

// Set by completeRedirect before React mounts, read once by the app layer's toast.
let signInRedirectFailure: SignInRedirectFailure | null = null

/** The outcome of a sign-in redirect that came back with an error on this page load, once. */
export function takeSignInRedirectFailure(): SignInRedirectFailure | null {
  const failure = signInRedirectFailure
  signInRedirectFailure = null
  return failure
}

// A sign-in the user abandons at the identity provider (cancelling the Google or username step,
// backing out of sign-up) comes back as an error response, not a result. It must not stop the app
// from starting: the user lands signed out and can try again. Entra reports a deliberate cancel as
// `access_denied`; anything else is a real failure the user is told about.
async function completeRedirect(instance: PublicClientApplication) {
  try {
    return await instance.handleRedirectPromise()
  } catch (error) {
    console.warn("[MSAL] sign-in redirect did not complete", error)
    signInRedirectFailure =
      error instanceof AuthError && error.errorCode === "access_denied"
        ? "cancelled"
        : "failed"
    // Either way, don't let a stale identity-provider session answer the next attempt: drop the
    // local accounts (no logout redirect) and the hint, and ask for a fresh login.
    try {
      await instance.clearCache()
    } catch (clearError) {
      console.warn("[MSAL] could not clear the account cache", clearError)
    }
    forgetAccountHint()
    safeStorage.set(FRESH_LOGIN_KEY, "1")
    return null
  }
}

export async function initializeAuthentication() {
  const msalInstance = new PublicClientApplication(createMsalConfig())

  await msalInstance.initialize()

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const result = event.payload as AuthenticationResult

      activateAccount(msalInstance, result.account)
    }
    // Only a completed interactive flow proves the identity provider session is good again.
    if (
      (event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
      event.interactionType === InteractionType.Redirect
    ) {
      forgetFreshLogin()
    }
  })

  // The redirect bridge (apps/web/redirect.html) already caches the response and navigates back to
  // where the flow was initiated before this ever runs, so navigateToLoginRequestUrl's default
  // (true) is a no-op safety net here, not a second navigation.
  const redirectResult = await completeRedirect(msalInstance)

  if (redirectResult) {
    forgetFreshLogin()
    activateAccount(msalInstance, redirectResult.account)
    returnHomeAfterLandingSignIn()
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

// Entra External ID's issuer acceleration value for Google: the sign-in page hands straight over to
// Google instead of asking for an email first (docs: concept-authentication-methods-customers).
export const GOOGLE_DOMAIN_HINT = "google"

/** Redirects a Google user straight to Google. Their `username` is a generated
 *  `<oid>@<tenant domain>` address, and MSAL sends `username` as the login_hint whenever a request
 *  carries an account — and it attaches the active account itself when the request names none. That
 *  hint made Entra ask for a password for the generated address, which no Google user has. So the
 *  active account is let go for the redirect (the response sets it again) and the domain hint picks
 *  the provider instead. If the redirect cannot start, the account is put back. */
async function redirectToGoogle(
  instance: PublicClientApplication,
  account: AccountInfo | null
) {
  instance.setActiveAccount(null)
  try {
    await instance.loginRedirect({
      scopes: loginRequest.scopes,
      domainHint: GOOGLE_DOMAIN_HINT,
      ...freshLoginPrompt(),
    })
  } catch (error) {
    if (account) instance.setActiveAccount(account)
    throw error
  }
}

function startInteraction() {
  const instance = getAuthentication()
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0]
  if (account) {
    if (getSignInMethod(account) === "google") {
      return redirectToGoogle(instance, account)
    }
    return instance.acquireTokenRedirect({
      account,
      scopes: loginRequest.scopes,
      ...freshLoginPrompt(),
    })
  }
  const hint = readAccountHint()
  if (hint && hintSignInMethod(hint) === "google") {
    return redirectToGoogle(instance, null)
  }
  return instance.loginRedirect({
    scopes: loginRequest.scopes,
    ...(hint ? { loginHint: hint.username } : {}),
    ...freshLoginPrompt(),
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
    // A cleared or expired token cache holds no account; the account hint says whose IdP session
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
    // Silent calls take the scopes only: the fresh-login prompt is for interactive flows.
    const result = await instance.acquireTokenSilent({
      scopes: loginRequest.scopes,
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
    const result = await instance.ssoSilent({
      scopes: loginRequest.scopes,
      ...who,
    })

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
