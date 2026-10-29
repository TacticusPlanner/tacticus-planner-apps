import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

export function AppLogo({ className }: { className?: string }) {
  return (
    <img
      aria-hidden="true"
      className={className}
      // The full logo; the browser tab keeps the emblem-only favicon, which reads better at 16px.
      src="/web-app-manifest-192x192.png"
      alt=""
      data-testid="app-header-logo"
    />
  )
}

/** Signed in, the header logo (and whatever sits beside it) links back to Home; signed out it is inert. */
export function AppLogoHomeLink({
  isAuthenticated,
  className,
  children,
}: {
  isAuthenticated: boolean
  className?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  if (!isAuthenticated) return <div className={className}>{children}</div>
  return (
    <Link
      // Names the visible app name too, so speech input can activate it by what it shows.
      aria-label={`${t("app.name")}, ${t("nav.home")}`}
      className={className}
      data-testid="app-logo-home-link"
      to="/home"
    >
      {children}
    </Link>
  )
}
