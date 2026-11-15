import { AuthError } from "@azure/msal-browser"

import { safeStorage } from "@/shared/lib"

import type { SignInMethod } from "./account-identity"

/**
 * What the sign-in machinery decided, step by step, kept on the device until the user is next
 * identified to analytics (spec: product-analytics, "Sign-in steps are reported once identified").
 * Restores, renewals and redirects mostly happen while nobody is identified (that is the point of
 * them), so they are recorded here and sent later as `auth_step` events, dated when they happened.
 * Entries hold step names, outcomes and protocol error codes only: never a username, hint, token,
 * URL or error message.
 */
export type AuthStep =
  /** The app-load restore from cached tokens (access token or refresh token, no frame). */
  | { step: "restore_cache"; outcome: "success" | "failed"; errorCode?: string }
  /** The hidden `prompt=none` frame (ssoSilent). */
  | {
      step: "restore_frame"
      outcome: "success" | "failed"
      errorCode?: string
      /** Whether the frame was asked about a cached account or only a remembered hint. */
      from: "account" | "hint"
    }
  /** A quiet top-level `prompt=none` redirect left the page. */
  | { step: "quiet_renewal_started"; from: "account" | "hint" }
  /** A quiet renewal was due but not run. */
  | {
      step: "quiet_renewal_skipped"
      reason: "cooldown" | "fresh_login" | "interaction" | "google"
    }
  /** The response to a quiet renewal, read on the page it returned to. */
  | {
      step: "quiet_renewal_returned"
      outcome: "success" | "no_session" | "failed" | "no_response"
      errorCode?: string
    }
  /** An interactive redirect left the page: started by the app (an API call or the player-data sync
   *  needed a new authorization) or by the user (a Sign in / Sign up button). */
  | {
      step: "interactive_redirect_started"
      trigger: "auto" | "user"
      method: SignInMethod | "unknown"
      freshLogin: boolean
    }
  /** An automatic interactive redirect was refused by the loop guard. */
  | { step: "interactive_redirect_skipped"; reason: "loop_guard" }
  /** The response to an interactive redirect, read on the page it returned to. */
  | {
      step: "interactive_redirect_returned"
      outcome: "success" | "cancelled" | "failed" | "no_response"
      errorCode?: string
    }

export type JournaledAuthStep = AuthStep & {
  /** Epoch ms when the step happened. */
  at: number
  /** Groups the steps of one page load. */
  load: string
  /** The sign-in method of the account this page load is restoring, when known. */
  method?: SignInMethod | "unknown"
}

const JOURNAL_KEY = "tp.auth.journal"
// Which redirect left the page last, so the page it returns to can tell "the response never
// arrived" (no_response) apart from an ordinary load.
const PENDING_REDIRECT_KEY = "tp.auth.pendingRedirect"
// A loop is a handful of steps per load; this keeps a few days of them and bounds the storage.
const MAX_ENTRIES = 60
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const pageLoadId = Math.random().toString(36).slice(2, 10)
let pageLoadMethod: SignInMethod | undefined

/** Stamps the account's sign-in method on every later step of this page load that has none. */
export function setAuthJournalMethod(method: SignInMethod) {
  pageLoadMethod = method
}

function readJournal(): JournaledAuthStep[] {
  try {
    const parsed: unknown = JSON.parse(safeStorage.get(JOURNAL_KEY) ?? "[]")
    if (!Array.isArray(parsed)) return []
    const oldest = Date.now() - MAX_AGE_MS
    return parsed.filter(
      (entry): entry is JournaledAuthStep =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as JournaledAuthStep).step === "string" &&
        typeof (entry as JournaledAuthStep).at === "number" &&
        (entry as JournaledAuthStep).at >= oldest
    )
  } catch {
    return []
  }
}

/** Records one step. Best effort: storage that refuses the write loses the entry, nothing else. */
export function recordAuthStep(step: AuthStep) {
  const entries = [
    ...readJournal(),
    {
      ...(pageLoadMethod ? { method: pageLoadMethod } : {}),
      ...step,
      at: Date.now(),
      load: pageLoadId,
    },
  ]
  safeStorage.set(JOURNAL_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)))
}

/** Every recorded step, oldest first, removing them from the device. */
export function takeAuthJournal(): JournaledAuthStep[] {
  const entries = readJournal()
  safeStorage.remove(JOURNAL_KEY)
  return entries
}

export type RedirectKind = "quiet" | "interactive"

/** Remembers that a redirect of this kind is about to leave the page. */
export function markRedirectPending(kind: RedirectKind) {
  safeStorage.set(PENDING_REDIRECT_KEY, kind)
}

/** The redirect this page load returns from, if one left the page; read once. */
export function takePendingRedirect(): RedirectKind | null {
  const kind = safeStorage.get(PENDING_REDIRECT_KEY)
  safeStorage.remove(PENDING_REDIRECT_KEY)
  return kind === "quiet" || kind === "interactive" ? kind : null
}

/** Signing out drops the journal, so the next account on the device never reports this one's. */
export function forgetAuthJournal() {
  safeStorage.remove(JOURNAL_KEY)
  safeStorage.remove(PENDING_REDIRECT_KEY)
}

const AADSTS_CODE = /AADSTS\d+/

/** The protocol error code of a failed MSAL call, plus Entra's AADSTS code when its message has
 *  one (it says why a session could not be used). The message itself is never kept. */
export function authErrorCode(error: unknown): string | undefined {
  if (!(error instanceof AuthError)) {
    return error instanceof Error ? error.name : undefined
  }
  const aadsts = AADSTS_CODE.exec(error.errorMessage)?.[0]
  return aadsts ? `${error.errorCode}:${aadsts}` : error.errorCode
}
