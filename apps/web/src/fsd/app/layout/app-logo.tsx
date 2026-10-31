import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export function AppLogo({ className }: { className?: string }) {
  return (
    <img
      aria-hidden="true"
      className={className}
      // The full logo; the tab favicon is the badge without its lettering, which reads better at 16px.
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

/** Marks the app as a beta release wherever the logo shows. */
export function BetaBadge({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <Badge
      className={cn(
        "shrink-0 px-1.5 text-[0.625rem] tracking-wider",
        className
      )}
      data-testid="app-beta-badge"
      variant="outline"
    >
      {t("app.beta")}
    </Badge>
  )
}
