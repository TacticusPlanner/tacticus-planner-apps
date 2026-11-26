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
} from "@azure/msal-browser"
import type {
  AccountInfo,
  AuthenticationResult,
  Configuration,
  EventMessage,
  IPublicClientApplication,
  RedirectRequest,
} from "@azure/msal-browser"

import { getRequiredEnvironmentValue } from "../config/environment"
import { getSignInMethod, isGeneratedUsername } from "./account-identity"
import type { SignInMethod } from "./account-identity"
import { hiddenFrameCannotSeeSession } from "./hidden-frame-support"
import {
  claimRedirectLock,
  releaseRedirectLock,
  reloadPage,
  waitForRedirectLock,
} from "./redirect-lock"
import {
  authErrorCode,
  currentNavigationType,
  markRedirectPending,
  recordAuthStep,
  setAuthJournalMethod,
  takePendingRedirect,
} from "./auth-journal"
import type { NavigationType } from "./auth-journal"
import { safeStorage, storageKeys } from "../lib"

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
const ACCOUNT_HINT_KEY = storageKeys.authAccountHint

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
    return typeof hint === "object" &&
      hint !== null &&
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

// A generated username always means Google, even when the stored method says email: hints written
// from an account whose claims lacked `idp` recorded the wrong one. Hints stored before
// `signInMethod` existed have only the username to go on.
function hintSignInMethod(hint: AccountHint): SignInMethod {
  return isGeneratedUsername(hint.username)
    ? "google"
    : (hint.signInMethod ?? "email")
}

export function forgetAccountHint() {
  safeStorage.remove(ACCOUNT_HINT_KEY)
}

// Armed when an interactive sign-in comes back with an error (spec: redirect-authentication): the
// identity provider may be answering from a session we can't use (in production, one whose account
// was deleted on another device), so the next interactive flow asks for a fresh login instead.
// Kept in localStorage like the hint, so a new tab doesn't spend another failing round trip.
const FRESH_LOGIN_KEY = storageKeys.authFreshLogin

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
const QUIET_RENEWAL_KEY = storageKeys.authQuietRenewal
export const QUIET_RENEWAL_COOLDOWN_MS = 12 * 60 * 60 * 1000

function readQuietRenewalStartedAt(): number | null {
  const startedAt = Number(safeStorage.get(QUIET_RENEWAL_KEY))
  return Number.isFinite(startedAt) && startedAt > 0 ? startedAt : null
}

/** Called when the user starts a sign-in themselves, and on sign-out. An automatic
 *  re-authentication leaves the cooldown running (see startInteraction). */
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
            case LogLevel.Trace:
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

// The return step carries the sign-in method (from the account hint until a result names the
// account) and how this page was loaded: a `reload` with no response means the page was reloaded
// before the redirect ever left it.
function prepareReturnStep(): { navigation?: NavigationType } {
  const hint = readAccountHint()
  if (hint) setAuthJournalMethod(hintSignInMethod(hint))
  const navigation = currentNavigationType()
  return navigation ? { navigation } : {}
}

// A sign-in the user abandons at the identity provider (cancelling the Google or username step,
// backing out of sign-up) comes back as an error response, not a result. It must not stop the app
// from starting: the user lands signed out and can try again. Entra reports a deliberate cancel as
// `access_denied`; anything else is a real failure the user is told about.
async function completeRedirect(instance: PublicClientApplication) {
  // Which redirect left the page: it tells a lost response from a plain load, and an interactive
  // response from a quiet renewal's while the renewal's cooldown is still running. Without the
  // marker (storage refused it), a quiet renewal that started recently is what this answers.
  const pending = takePendingRedirect()
  const quietRenewal = pending ? pending === "quiet" : quietRenewalCoolingDown()
  const returnStep = quietRenewal
    ? ("quiet_renewal_returned" as const)
    : ("interactive_redirect_returned" as const)
  const loaded = prepareReturnStep()
  try {
    const result = await instance.handleRedirectPromise().finally(
      // Whatever came back, tabs waiting on this one's redirect can go on.
      releaseRedirectLock
    )
    if (result) {
      safeStorage.remove(QUIET_RENEWAL_KEY)
      setAuthJournalMethod(getSignInMethod(result.account))
      recordAuthStep({ step: returnStep, outcome: "success", ...loaded })
    } else if (pending) {
      recordAuthStep({ step: returnStep, outcome: "no_response", ...loaded })
    }
    return { result, quietRenewal }
  } catch (error) {
    if (quietRenewal && isInteractionRequired(error)) {
      recordAuthStep({
        step: "quiet_renewal_returned",
        outcome: "no_session",
        errorCode: authErrorCode(error),
        ...loaded,
      })
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
    recordAuthStep(
      returnStep === "quiet_renewal_returned"
        ? {
            step: returnStep,
            outcome: "failed",
            errorCode: authErrorCode(error),
            ...loaded,
          }
        : {
            step: returnStep,
            outcome: signInRedirectFailure,
            errorCode: authErrorCode(error),
            ...loaded,
          }
    )
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
    safeStorage.remove(AUTO_REDIRECTS_KEY)
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

const NETWORK_ERROR_CODES: ReadonlySet<string> = new Set([
  BrowserAuthErrorCodes.noNetworkConnectivity,
  BrowserAuthErrorCodes.postRequestFailed,
  BrowserAuthErrorCodes.getRequestFailed,
  // ClientAuthErrorCodes.endpointResolutionError, spelled out: importing that namespace pulls every
  // client error code into the startup bundle.
  "endpoints_resolution_error",
])

/** The identity provider could not be reached (offline, a failed request, no authority metadata). */
function isNetworkError(error: unknown): boolean {
  return error instanceof AuthError && NETWORK_ERROR_CODES.has(error.errorCode)
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

// Loop guard (spec: redirect-authentication): automatic re-authentication redirects are capped per
// device, so a redirect that keeps coming back without a usable response can't bounce the user
// forever. A completed redirect sign-in resets it; a user's own Sign in is never capped.
const AUTO_REDIRECTS_KEY = storageKeys.authAutoRedirects
export const MAX_AUTO_REDIRECTS = 3
export const AUTO_REDIRECT_WINDOW_MS = 10 * 60 * 1000

/** On sign-out: the next account on the device starts with a fresh allowance. */
export function forgetAutoRedirects() {
  safeStorage.remove(AUTO_REDIRECTS_KEY)
}

class AutoRedirectLimitError extends Error {
  constructor() {
    super("Automatic sign-in redirects paused: too many in a short time.")
    this.name = "AutoRedirectLimitError"
  }
}

/** Counts one more automatic redirect, or throws when the guard's limit is reached. */
function claimAutoRedirect() {
  const now = Date.now()
  let recent: number[] = []
  try {
    const parsed: unknown = JSON.parse(
      safeStorage.get(AUTO_REDIRECTS_KEY) ?? "[]"
    )
    if (Array.isArray(parsed)) {
      recent = parsed.filter(
        (at): at is number =>
          typeof at === "number" && now - at < AUTO_REDIRECT_WINDOW_MS
      )
    }
  } catch {
    // Unreadable: start counting afresh.
  }
  if (recent.length >= MAX_AUTO_REDIRECTS) {
    recordAuthStep({
      step: "interactive_redirect_skipped",
      reason: "loop_guard",
    })
    throw new AutoRedirectLimitError()
  }
  safeStorage.set(AUTO_REDIRECTS_KEY, JSON.stringify([...recent, now]))
}

export function requestInteraction(): Promise<void> {
  if (interaction) return interaction
  const request = Promise.resolve().then(startInteraction)
  interaction = request
  request.catch(() => {
    // It never left the page: there is no response to wait for.
    takePendingRedirect()
    releaseRedirectLock()
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

// The quiet renewal's cooldown is left running: the pending-redirect marker already tells this
// redirect's response apart from a quiet renewal's, and clearing it let the next load renew quietly
// again before re-authenticating, which doubled every bounce.
async function startInteraction(): Promise<void> {
  const instance = getAuthentication()
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0]
  const hint = readAccountHint()
  const method = account
    ? getSignInMethod(account)
    : hint
      ? hintSignInMethod(hint)
      : undefined
  if (method) setAuthJournalMethod(method)
  if (!(await claimRedirectLock())) {
    recordAuthStep({
      step: "interactive_redirect_skipped",
      reason: "other_tab",
    })
    return waitForOtherTabThenReload()
  }
  claimAutoRedirect()
  recordInteractiveRedirect("auto", {
    method: method ?? "unknown",
    freshLogin: Boolean(freshLoginPrompt().prompt),
  })
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
  if (hint && hintSignInMethod(hint) === "google") {
    return redirectToGoogle(instance, null)
  }
  return instance.loginRedirect({
    scopes: loginRequest.scopes,
    ...(hint ? { loginHint: hint.username } : {}),
    ...freshLoginPrompt(),
  })
}

/** Another tab is redirecting for the same session: wait for it to come back, then reload, which
 *  restores from the tokens it saved to the shared cache (or, if it came back without any, lets this
 *  tab try on its own). The returned promise never settles; the page reloads. */
function waitForOtherTabThenReload(): Promise<never> {
  void waitForRedirectLock().then(reloadPage)
  return new Promise<never>(() => {})
}

/** Journals an interactive redirect that is about to leave the page (see auth-journal). */
export function recordInteractiveRedirect(
  trigger: "auto" | "user",
  details: { method: SignInMethod | "unknown"; freshLogin: boolean }
) {
  recordAuthStep({ step: "interactive_redirect_started", trigger, ...details })
  markRedirectPending("interactive")
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
    const method = hintSignInMethod(hint)
    setAuthJournalMethod(method)
    if (method === "google") return skipSilentChecksForGoogle()
    const outcome = hiddenFrameCannotSeeSession()
      ? skipHiddenFrame("hint")
      : await checkIdentityProviderSession(instance, silentHint(hint), "hint")
    return outcome === "failed" ? renewQuietly(instance, null, hint) : outcome
  }

  setAuthJournalMethod(getSignInMethod(cachedAccount))

  // Cached tokens first: a valid access token or refresh token restores the session with no
  // hidden frame at all, which is the common case for a returning user within the refresh token's
  // lifetime. Only when neither is usable is the IdP session checked through a frame.
  const cached = await restoreFromCachedTokens(instance, cachedAccount)
  if (cached === "success") return "success"
  // The identity provider could not be reached, so nothing says the refresh token is spent: a
  // hidden frame or a quiet renewal would fail the same way (and a renewal would start its
  // cooldown). The cached account stays, and the first API call tries the refresh token again.
  if (cached === "unreachable") return "failed"

  if (getSignInMethod(cachedAccount) === "google") {
    return skipSilentChecksForGoogle()
  }

  // A quiet renewal that came back empty-handed earlier: the identity provider has no session to
  // give, through a frame or otherwise, so the user signs in by hand.
  if (quietRenewalCoolingDown()) {
    recordAuthStep({ step: "quiet_renewal_skipped", reason: "cooldown" })
    return "failed"
  }

  // Without an account/sid/loginHint, ssoSilent can't tell which session to restore once more
  // than one account is cached, and fails with an ambiguity error even though a valid session
  // exists for one of them.
  const outcome = hiddenFrameCannotSeeSession()
    ? skipHiddenFrame("account")
    : await checkIdentityProviderSession(
        instance,
        { account: cachedAccount },
        "account"
      )
  return outcome === "failed"
    ? renewQuietly(instance, cachedAccount, readAccountHint())
    : outcome
}

/** The app-load restore from cached tokens: "failed" when no token is usable (expected once the
 *  refresh token has expired), "unreachable" when the identity provider could not be asked. */
async function restoreFromCachedTokens(
  instance: IPublicClientApplication,
  account: AccountInfo
): Promise<"success" | "failed" | "unreachable"> {
  try {
    // Silent calls take the scopes only: the fresh-login prompt is for interactive flows.
    const result = await instance.acquireTokenSilent({
      scopes: loginRequest.scopes,
      account,
      cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken,
    })

    activateAccount(instance, result.account)
    recordAuthStep({ step: "restore_cache", outcome: "success" })

    return "success"
  } catch (error) {
    recordAuthStep({
      step: "restore_cache",
      outcome: "failed",
      errorCode: authErrorCode(error),
    })
    return isNetworkError(error) ? "unreachable" : "failed"
  }
}

/** Google accounts skip the hidden frame and the quiet renewal: neither ever finds their session
 *  (production auth_step data, Nov 2026: 0 of 86 frames and 0 of 99 quiet renewals succeeded,
 *  `login_required:AADSTS50058`), while the interactive redirect that followed came back signed in
 *  with no clicks in about 2s. With a cached account, the API call that needs a token then starts
 *  that redirect; with only a hint, the user lands signed out as before. */
function skipSilentChecksForGoogle(): SilentSignInOutcome {
  recordAuthStep({ step: "quiet_renewal_skipped", reason: "google" })
  return "failed"
}

/** Browsers that keep the identity provider's cookies out of hidden frames go straight to the quiet
 *  renewal (see hidden-frame-support). */
function skipHiddenFrame(from: "account" | "hint"): SilentSignInOutcome {
  recordAuthStep({ step: "restore_frame", outcome: "skipped", from })
  return "failed"
}

/** One top-level `prompt=none` redirect (see QUIET_RENEWAL_KEY), joined by any caller that asks for
 *  interaction meanwhile. Skipped while cooling down, or while a fresh login is required. */
async function renewQuietly(
  instance: IPublicClientApplication,
  account: AccountInfo | null,
  hint: AccountHint | null
): Promise<SilentSignInOutcome> {
  const skipped = interaction
    ? ("interaction" as const)
    : quietRenewalCoolingDown()
      ? ("cooldown" as const)
      : freshLoginPrompt().prompt
        ? ("fresh_login" as const)
        : null
  if (skipped) {
    recordAuthStep({ step: "quiet_renewal_skipped", reason: skipped })
    return "failed"
  }
  if (!(await claimRedirectLock())) {
    recordAuthStep({ step: "quiet_renewal_skipped", reason: "other_tab" })
    void waitForRedirectLock().then(reloadPage)
    return "redirecting"
  }
  safeStorage.set(QUIET_RENEWAL_KEY, String(Date.now()))
  recordAuthStep({
    step: "quiet_renewal_started",
    from: account ? "account" : "hint",
  })
  markRedirectPending("quiet")
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
    takePendingRedirect()
    releaseRedirectLock()
    if (interaction === request) interaction = null
    return "failed"
  }
}

/** One hidden IdP session check (bounded by SILENT_FRAME_TIMEOUT_MS). */
async function checkIdentityProviderSession(
  instance: IPublicClientApplication,
  who: { account: AccountInfo } | { loginHint: string } | { sid: string },
  from: "account" | "hint"
): Promise<SilentSignInOutcome> {
  try {
    const result = await instance.ssoSilent({
      scopes: loginRequest.scopes,
      ...who,
    })

    activateAccount(instance, result.account)
    recordAuthStep({ step: "restore_frame", outcome: "success", from })

    return "success"
  } catch (error) {
    // A rejected/timed-out silent attempt is an expected, common outcome (no live IdP session,
    // third-party storage blocked) and is never surfaced to the user - only log the cases
    // isInteractionRequired() doesn't already account for, since those are genuinely unexpected.
    if (!isInteractionRequired(error)) {
      console.error("[MSAL] silent sign-in failed unexpectedly", error)
    }
    recordAuthStep({
      step: "restore_frame",
      outcome: "failed",
      errorCode: authErrorCode(error),
      from,
    })

    return "failed"
  }
}
