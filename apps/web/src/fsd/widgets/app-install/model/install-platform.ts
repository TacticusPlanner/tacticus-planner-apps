/**
 * How this browser installs the app when it offers no install prompt of its own: iOS and iPadOS
 * (Share, then Add to Home Screen, in Safari and in Chrome or Edge since iOS 16.4), Safari on macOS
 * (File, then Add to Dock), Android browsers (the browser menu), Chromium on desktop (the address
 * bar or the browser menu), or none (Firefox on desktop cannot install web apps).
 */
export type InstallPlatform =
  "ios" | "macSafari" | "android" | "desktop" | "unsupported"

/** Reads the platform from the user agent. iPadOS reports a Mac user agent, so a Mac with a
 *  touch screen counts as iOS. */
export function detectInstallPlatform(
  userAgent: string,
  maxTouchPoints: number
): InstallPlatform {
  const isMac = /Macintosh/i.test(userAgent)
  if (/iPhone|iPad|iPod/i.test(userAgent) || (isMac && maxTouchPoints > 1)) {
    return "ios"
  }
  if (/Android/i.test(userAgent)) return "android"
  const isChromium = /Chrome|Chromium|CriOS|Edg\/|OPR\//i.test(userAgent)
  if (isChromium) return "desktop"
  if (isMac && /Safari/i.test(userAgent) && !/Firefox/i.test(userAgent)) {
    return "macSafari"
  }
  return "unsupported"
}

/** Whether the page is running as the installed app rather than in a browser tab. */
export function isRunningInstalled(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      // Safari on iOS only: true when opened from the home screen.
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}
