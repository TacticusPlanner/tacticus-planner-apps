export type ShareResult = "shared" | "copied" | "error"

/** Shares the current page URL (which already carries the applied lookup selection as query
 *  params) via the Web Share sheet on mobile when available, otherwise copies it to the clipboard. */
export async function shareCurrentLookupUrl(
  preferWebShare: boolean
): Promise<ShareResult> {
  const url = window.location.href

  if (preferWebShare && typeof navigator.share === "function") {
    try {
      await navigator.share({ url })
      return "shared"
    } catch (error) {
      // The user dismissing the native share sheet isn't a failure worth reporting.
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared"
      }
      // Otherwise fall through to the clipboard fallback below.
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return "copied"
  } catch {
    return "error"
  }
}
