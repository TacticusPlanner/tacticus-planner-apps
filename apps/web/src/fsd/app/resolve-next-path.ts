/** Where a user lands when no usable destination was remembered. */
export const DEFAULT_SIGNED_IN_PATH = "/home"

const SETUP_PATH = "/setup"
// A scheme only counts at the very start — a colon later on is legitimate inside a query string.
const LEADING_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * Resolves the `next` parameter the onboarding gate attaches when it sends a user to setup.
 *
 * The value reaches us straight from the URL, so it is attacker-controllable through a crafted
 * link: without validation, completing setup would be an open redirect. Only a same-origin relative
 * path is accepted, and a path pointing back at setup is refused too — that would make the setup
 * route's own guard navigate from setup to setup.
 */
export function resolveNextPath(next: string | null | undefined): string {
  if (!next) {
    return DEFAULT_SIGNED_IN_PATH
  }

  // Backslashes are normalized to "/" by some browsers, so "/\evil.example" can become a
  // protocol-relative URL. Reject them outright rather than trying to model each browser.
  if (next.includes("\\")) {
    return DEFAULT_SIGNED_IN_PATH
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_SIGNED_IN_PATH
  }

  if (LEADING_SCHEME.test(next)) {
    return DEFAULT_SIGNED_IN_PATH
  }

  const path = next.split(/[?#]/)[0]
  if (path === SETUP_PATH || path.startsWith(`${SETUP_PATH}/`)) {
    return DEFAULT_SIGNED_IN_PATH
  }

  return next
}
