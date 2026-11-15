/** Where a user lands when no usable destination was remembered. */
export const DEFAULT_SIGNED_IN_PATH = "/home"

const SETUP_PATH = "/setup"
// A scheme only counts at the very start — a colon later on is legitimate inside a query string.
const LEADING_SCHEME = /^[a-z][a-z0-9+.-]*:/i
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/

/**
 * Resolves a `next` parameter to a safe same-origin destination.
 *
 * The value reaches us straight from the URL, so it is attacker-controllable through a crafted
 * link: without validation, honoring it would be an open redirect. Only a same-origin relative path
 * is accepted.
 *
 * By default a path pointing back at setup is also refused — this is the onboarding gate's use,
 * where sending an already-configured user back to `/setup` would make that route's own guard
 * navigate from setup to setup. Pass `allowSetupDestination: true` for the one other caller
 * (`LandingRoute`, restoring an unauthenticated visitor's original `/setup/*` deep link after
 * sign-in) where landing back on setup is the intended outcome, not a loop.
 */
export function resolveNextPath(
  next: string | null | undefined,
  options?: { allowSetupDestination?: boolean }
): string {
  if (!next) {
    return DEFAULT_SIGNED_IN_PATH
  }

  // Backslashes are normalized to "/" by some browsers, so "/\evil.example" can become a
  // protocol-relative URL. Reject them outright rather than trying to model each browser.
  if (next.includes("\\")) {
    return DEFAULT_SIGNED_IN_PATH
  }

  // URL parsers drop tabs and newlines, so "/\t/evil.example" would also become protocol-relative.
  // No real path contains control characters; refuse them instead of relying on the router.
  if (CONTROL_CHARACTER.test(next)) {
    return DEFAULT_SIGNED_IN_PATH
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_SIGNED_IN_PATH
  }

  if (LEADING_SCHEME.test(next)) {
    return DEFAULT_SIGNED_IN_PATH
  }

  if (!options?.allowSetupDestination) {
    const path = next.split(/[?#]/)[0] ?? next
    if (path === SETUP_PATH || path.startsWith(`${SETUP_PATH}/`)) {
      return DEFAULT_SIGNED_IN_PATH
    }
  }

  return next
}
