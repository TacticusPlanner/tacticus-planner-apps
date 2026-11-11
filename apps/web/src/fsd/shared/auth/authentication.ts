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
// `loginHint` (the ID token's opaque `login_hint` claim) and `sid` (its session id), when the app
// registration emits them, pick the right account in an identity-provider session holding several.
type AccountHint = {
  homeAccountId: string
  username: string
  signInMethod?: SignInMethod
  loginHint?: string
  sid?: string
}

/** The best hint a remembered account offers for a silent (`prompt=none`) request. */
function silentHint(
  hint: AccountHint
): { loginHint: string } | { sid: string } {
  if (hint.loginHint) return { loginHint: hint.loginHint }
  return hint.sid ? { sid: hint.sid } : { loginHint: hint.username }
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

// Quiet renewal (spec: silent-sign-in): SPA refresh tokens last 24h, fixed by Entra. Past that, the
// hidden frame is the only silent path, and it fails wherever the browser keeps the identity
// provider's cookies out of third-party frames (Safari, Firefox, Brave, installed apps), even though
// the "Stay signed in" session is still alive. A top-level `prompt=none` redirect carries those
// cookies first-party: with a live session it comes straight back signed in, with none it comes
// back with an error and the user lands signed out as before. Recorded here so the return trip is
// recognized, and so a failed attempt is not repeated on every load.
const QUIET_RENEWAL_KEY = "tp.auth.quietRenewal"
export const QUIET_RENEWAL_COOLDOWN_MS = 12 * 60 * 60 * 1000

function readQuietRenewalStartedAt(): number | null {
  const startedAt = Number(safeStorage.get(QUIET_RENEWAL_KEY))
  return Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null
}

/** Called whenever an interactive flow starts, so its own response is never taken for a quiet
 *  renewal's, and on sign-out. */
export function forgetQuietRenewal() {
  safeStorage.remove(QUIET_RENEWAL_KEY)
}

function quietRenewalCoolingDown(): boolean {
  const startedAt = readQuietRenewalStartedAt()
  return (
    startedAt !== null && Date.now() - startedAt < QUIET_RENEWAL_COOLDOWN_MS
  )
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
      ...(typeof account.idTokenClaims?.login_hint === "string"
        ? { loginHint: account.idTokenClaims.login_hint }
        : {}),
      ...(typeof account.idTokenClaims?.sid === "string"
        ? { sid: account.idTokenClaims.sid }
        : {}),
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
  // Read before handling: a quiet renewal that started recently is what this response answers.
  const quietRenewal = quietRenewalCoolingDown()
  try {
    const result = await instance.handleRedirectPromise()
    if (result) safeStorage.remove(QUIET_RENEWAL_KEY)
    return { result, quietRenewal }
  } catch (error) {
    if (quietRenewal && isInteractionRequired(error)) {
      // No live session to renew from: not a failed sign-in. The cached account and hint stay, the
      // marker stays as the cooldown, and the user lands signed out with no toast. Logged with
      // Entra's own reason (AADSTS code), which says why the session could not be used.
      console.info(
        "[MSAL] quiet session renewal found no usable session",
        error instanceof AuthError
          ? `${error.errorCode}: ${error.errorMessage}`
          : error
      )
      return { result: null, quietRenewal }
    }
    safeStorage.remove(QUIET_RENEWAL_KEY)
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
    return { result: null, quietRenewal: false }
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
  const { result: redirectResult, quietRenewal } =
    await completeRedirect(msalInstance)

  if (redirectResult) {
    forgetFreshLogin()
    activateAccount(msalInstance, redirectResult.account)
    // A quiet renewal returns to whatever page was open, the landing page included.
    if (!quietRenewal) returnHomeAfterLandingSignIn()
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
    ...(restoreOutcome === "failed" || restoreOutcome === "redirecting"
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
  // A `prompt=none` redirect that finds no usable session comes back with one of the OIDC
  // interaction errors.
  return (
    error instanceof AuthError &&
    [
      "invalid_grant",
      "login_required",
      "interaction_required",
      "consent_required",
    ].includes(error.errorCode)
  )
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

/** Re-authenticates a Google user. Their `username` is a generated `<oid>@<tenant domain>` address,
 *  and MSAL sends `username` as the login_hint whenever a request carries an account — and it
 *  attaches the active account itself when the request names none. That hint made Entra ask for a
 *  password for the generated address, which no Google user has. So the active account is let go
 *  for the redirect (the response sets it again) and Entra's own sign-in page is shown, where the
 *  user picks Google. No domain_hint: this tenant rejects `domain_hint=google` with AADSTS90023
 *  ("'google' pair is not an external identity provider"). If the redirect cannot start, the
 *  account is put back. */
async function redirectToGoogle(
  instance: IPublicClientApplication,
  account: AccountInfo | null,
  prompt: { prompt?: string } = freshLoginPrompt()
) {
  instance.setActiveAccount(null)
  try {
    await instance.loginRedirect({
      scopes: loginRequest.scopes,
      ...prompt,
    })
  } catch (error) {
    if (account) instance.setActiveAccount(account)
    throw error
  }
}

function startInteraction() {
  forgetQuietRenewal()
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

// "redirecting": a quiet renewal is leaving the page; the restore is still in progress.
export type SilentSignInOutcome =
  "success" | "no-cached-account" | "failed" | "redirecting"

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
    if (!hint) return "no-cached-account"
    const outcome = await checkIdentityProviderSession(
      instance,
      silentHint(hint)
    )
    return outcome === "failed" ? renewQuietly(instance, null, hint) : outcome
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

  // A quiet renewal that came back empty-handed earlier: the identity provider has no session to
  // give, through a frame or otherwise, so the user signs in by hand.
  if (quietRenewalCoolingDown()) return "failed"

  // Without an account/sid/loginHint, ssoSilent can't tell which session to restore once more
  // than one account is cached, and fails with an ambiguity error even though a valid session
  // exists for one of them.
  const outcome = await checkIdentityProviderSession(instance, {
    account: cachedAccount,
  })
  return outcome === "failed"
    ? renewQuietly(instance, cachedAccount, readAccountHint())
    : outcome
}

/** One top-level `prompt=none` redirect (see QUIET_RENEWAL_KEY), joined by any caller that asks for
 *  interaction meanwhile. Skipped while cooling down, or while a fresh login is required. */
async function renewQuietly(
  instance: IPublicClientApplication,
  account: AccountInfo | null,
  hint: AccountHint | null
): Promise<SilentSignInOutcome> {
  if (interaction || quietRenewalCoolingDown() || freshLoginPrompt().prompt) {
    return "failed"
  }
  safeStorage.set(QUIET_RENEWAL_KEY, String(Date.now()))
  const none = { prompt: PromptValue.NONE }
  // Unlike interactive re-authentication, every account keeps its hint here, Google ones included:
  // `prompt=none` never shows a page, so the generated Google username can't lead to a password
  // prompt, and without a hint Entra can't pick among several accounts in one session and gives up.
  // MSAL sends the best hint the account has: the opaque `login_hint` claim, then `sid`, then the
  // username.
  const request = Promise.resolve().then(() => {
    if (account) {
      return instance.acquireTokenRedirect({
        account,
        scopes: loginRequest.scopes,
        ...none,
      })
    }
    return instance.loginRedirect({
      scopes: loginRequest.scopes,
      ...(hint ? silentHint(hint) : {}),
      ...none,
    })
  })
  interaction = request
  try {
    await request
    return "redirecting"
  } catch (error) {
    console.warn("[MSAL] quiet session renewal could not start", error)
    if (interaction === request) interaction = null
    return "failed"
  }
}

/** One hidden IdP session check (bounded by SILENT_FRAME_TIMEOUT_MS). */
async function checkIdentityProviderSession(
  instance: IPublicClientApplication,
  who: { account: AccountInfo } | { loginHint: string } | { sid: string }
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
