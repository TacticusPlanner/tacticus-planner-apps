import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

// Mirrors site.webmanifest's `background_color` and the static boot markup in index.html, so the
// installed app's splash, the HTML before the bundle runs and this screen read as one surface.
const BOOT_BACKGROUND = "bg-[#0B1222]"

/**
 * The one waiting screen for everything that happens before the first real content: translations,
 * MSAL's startup, the silent sign-in and the first account check (spec: app-startup). It covers the
 * viewport wherever it mounts, so a guard inside the app shell does not flash the shell around it,
 * and it stays dark in both themes, like the splash it continues.
 *
 * `children` is an optional message under the logo (e.g. "still loading"); it is positioned out of
 * flow so the logo never moves when one appears. The logo matches the size and position of the
 * Android splash icon it follows, so the hand-over does not jump.
 */
export function BootScreen({
  children,
  testId = "app-loading",
}: {
  children?: ReactNode
  testId?: string
}) {
  // No Suspense here: this is the fallback while translations load, so it must render without them.
  const { t, ready } = useTranslation("common", { useSuspense: false })

  return (
    <div
      aria-label={ready ? t("common.loading") : "Loading…"}
      aria-live="polite"
      className={`dark fixed inset-0 z-100 flex items-center justify-center ${BOOT_BACKGROUND} text-foreground`}
      data-testid={testId}
      role="status"
    >
      {/* The logo alone sets the box, so it sits at the viewport's centre at the splash's size and
          the pulse and any message hang below it without moving it. */}
      <div className="relative">
        <img
          alt=""
          aria-hidden="true"
          className="block size-52"
          src="/web-app-manifest-192x192.png"
        />
        <div className="absolute top-full left-1/2 mt-6 flex w-72 -translate-x-1/2 flex-col items-center gap-6 text-center">
          <div
            aria-hidden="true"
            className="h-1 w-16 animate-pulse rounded-full bg-white/30 motion-reduce:animate-none"
          />
          {children ? (
            <div className="flex flex-col items-center gap-2">{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
