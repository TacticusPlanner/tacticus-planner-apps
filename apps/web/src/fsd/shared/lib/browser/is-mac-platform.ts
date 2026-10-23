/** Shared by every desktop shortcut hint (Search, Create Goal, Sync) to pick the Mac glyph form
 *  ("⌘K") vs. the Windows/Linux text form ("Ctrl+K") without duplicating the platform check. */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false

  return (
    /mac/i.test(navigator.platform ?? "") ||
    /mac/i.test(navigator.userAgent ?? "")
  )
}
