/**
 * Whether this browser keeps the identity provider's cookies out of hidden third-party frames, so a
 * hidden `prompt=none` frame can never see the user's session (spec: silent-sign-in). Production
 * auth_step data, Nov 2026: Safari and every iOS browser 1 of 101 frames, Firefox 0 of 29, Brave 2
 * of 18, while Chrome found the session in 39 of 91; later, Samsung Internet 0 of 25 while its quiet
 * renewals came back signed in 24 of 30. These browsers go straight to the quiet top-level renewal
 * instead of waiting out a frame that fails, sometimes only at its timeout.
 */
export function hiddenFrameCannotSeeSession(
  userAgent: string = navigator.userAgent,
  isBrave: boolean = "brave" in navigator
): boolean {
  if (isBrave) return true
  // Firefox (desktop, Android) and Firefox for iOS.
  if (/Firefox\/|FxiOS\//.test(userAgent)) return true
  // Samsung Internet (Android), whose anti-tracking blocks the frame's cookies by default.
  if (/SamsungBrowser\//.test(userAgent)) return true
  // Every iOS browser runs on WebKit, and so does desktop Safari; iPadOS reports itself as a Mac.
  if (/iPhone|iPad|iPod/.test(userAgent)) return true
  return (
    /Macintosh/.test(userAgent) &&
    /Safari\//.test(userAgent) &&
    !/Chrome\/|Chromium\/|Edg\/|OPR\//.test(userAgent)
  )
}
