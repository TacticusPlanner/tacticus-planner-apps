import type { UserJotTokenContext } from "@/entities/account"
import { isRunningInstalled } from "@/widgets/app-install"

/**
 * Where the widget opens, as the v3 SDK's `open()` accepts it: a screen, one changelog post
 * (`updateId`), one feedback request (`submissionId`), or the submit form (`compose`). The SDK
 * rejects a target that names both a request and the form, so the union keeps them apart.
 */
export type UserJotOpenTarget =
  | { to: "home" | "roadmap" | "updates" }
  | { to: "updates"; updateId: string }
  | { to: "feedback" }
  | { to: "feedback"; submissionId: string }
  | { to: "feedback"; compose: true }

/** The context sent with each token request: the running build, installed app or browser tab, and UI language. */
export function userJotTokenContext(language: string): UserJotTokenContext {
  const appVersion = import.meta.env.VITE_APP_VERSION
  return {
    ...(appVersion ? { appVersion } : {}),
    appMode: isRunningInstalled() ? "installed" : "browser",
    language,
  }
}

/** `?changelog=<UserJot update id>` opens that changelog post; `?feedback=<UserJot request id>` opens that request.
 *  Lets an announcement (Discord, a changelog post, an in-app hint) link into the in-app widget, signed in. */
const USERJOT_DEEP_LINK_PARAMS = {
  update: "changelog",
  submission: "feedback",
} as const

const MAX_ID_LENGTH = 64

function readId(params: URLSearchParams, name: string): string | undefined {
  const value = params.get(name)?.trim()
  return value && value.length <= MAX_ID_LENGTH ? value : undefined
}

/** The widget target a deep link asks for, or null when the URL carries none. A changelog link wins
 *  when both are present; either way both params are consumed. */
export function readUserJotDeepLink(
  params: URLSearchParams
): UserJotOpenTarget | null {
  const updateId = readId(params, USERJOT_DEEP_LINK_PARAMS.update)
  if (updateId) return { to: "updates", updateId }
  const submissionId = readId(params, USERJOT_DEEP_LINK_PARAMS.submission)
  if (submissionId) return { to: "feedback", submissionId }
  return null
}

/** The same params without the deep-link ones, so a reload or Back does not reopen the widget. */
export function withoutUserJotDeepLink(
  params: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams(params)
  next.delete(USERJOT_DEEP_LINK_PARAMS.update)
  next.delete(USERJOT_DEEP_LINK_PARAMS.submission)
  return next
}
