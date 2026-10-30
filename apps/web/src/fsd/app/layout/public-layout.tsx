import { Suspense, useEffect, type ReactNode } from "react"
import { ExternalLink, LogIn, Settings, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Spinner } from "@workspace/ui/components/spinner"

import { useIsAuthenticated } from "@azure/msal-react"

import { useSignInRedirect } from "@/shared/auth"
import {
  DISCORD_INVITE_URL,
  GITHUB_ORG_URL,
  isUiKitEnabled,
} from "@/shared/config"
import { GuestPreferencesCard, USERJOT_BOARD_URL } from "@/widgets/account-menu"

import { AppLogo } from "./app-logo"
import { documentTitle } from "./document-title"
import { SkipLink } from "./skip-link"

/**
 * Chrome for the public pages (landing, privacy, terms), deliberately NOT the app shell: a visitor here
 * may have no account, so the shell's navigation, search and sync controls would all lead to
 * sign-in. The top bar carries identity, a Library shortcut, preferences and one account action;
 * the footer carries the fan-project disclaimer and the project's external links.
 *
 * No UserJot widget is mounted here (it lives in AppShell), so the preferences card is rendered
 * without its Changelog row and feedback is a plain link to the public board.
 */
export function PublicLayout({
  children,
  pageTitle,
}: {
  children: ReactNode
  /** Browser-title prefix; omitted on the landing page, which is titled with the app name alone. */
  pageTitle?: string
}) {
  const { t } = useTranslation()
  const appName = t("app.name")

  useEffect(() => {
    document.title = documentTitle(pageTitle, appName)
  }, [appName, pageTitle])

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SkipLink />
      <PublicTopBar />
      <main
        className="flex flex-1 flex-col outline-none"
        id="main"
        tabIndex={-1}
      >
        <Suspense
          fallback={
            <div
              aria-label={t("common.loading")}
              className="flex flex-1 items-center justify-center py-16"
              role="status"
            >
              <Spinner aria-hidden="true" className="size-8 text-primary" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  )
}

function PublicTopBar() {
  const { t } = useTranslation(["common", "library"])
  const isAuthenticated = useIsAuthenticated()
  const { checkingSignIn, disabled, signIn, signUp } = useSignInRedirect()

  return (
    <header className="sticky top-0 z-30 border-b bg-topbar/85 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
        <Link
          className="flex min-w-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          to="/"
        >
          <AppLogo className="size-8 shrink-0" />
          <span className="truncate font-heading text-sm font-semibold tracking-tight">
            {t("app.name")}
          </span>
        </Link>
        <span className="flex-1" />
        <Button
          asChild
          className="hidden md:inline-flex"
          size="sm"
          variant="ghost"
        >
          <Link to="/library/characters">{t("library:section.label")}</Link>
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              aria-label={t("settings.label")}
              className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
              size="icon"
              variant="ghost"
            >
              <Settings />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 gap-2"
            collisionPadding={8}
            side="bottom"
          >
            <PopoverArrow />
            <GuestPreferencesCard />
          </PopoverContent>
        </Popover>
        {isAuthenticated ? (
          <Button asChild size="sm">
            <Link to="/home">{t("publicSite.openPlanner")}</Link>
          </Button>
        ) : (
          <>
            {/* min-w-0 + truncate: the long "signing you in" label must not push the row past a
                360px screen while Sign up sits next to it. */}
            <Button
              className="min-w-0"
              disabled={disabled}
              onClick={signIn}
              size="sm"
              variant="ghost"
            >
              <LogIn data-icon="inline-start" />
              <span className="truncate">
                {checkingSignIn ? t("auth.checkingSignIn") : t("auth.signIn")}
              </span>
            </Button>
            <Button
              data-testid="public-sign-up"
              disabled={disabled}
              onClick={signUp}
              size="sm"
            >
              <UserPlus data-icon="inline-start" />
              {t("auth.signUp")}
            </Button>
          </>
        )}
      </div>
    </header>
  )
}

function FooterExternalLink({
  children,
  href,
}: {
  children: ReactNode
  href: string
}) {
  return (
    <a
      className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
      <ExternalLink aria-hidden="true" className="size-3" />
    </a>
  )
}

function PublicFooter() {
  const { t } = useTranslation()
  const internalLinkClass =
    "rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"

  return (
    <footer className="border-t pb-[env(safe-area-inset-bottom)] text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:px-6">
        <p className="md:flex-1">{t("publicSite.disclaimer")}</p>
        <nav aria-label={t("publicSite.footerNav")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <FooterExternalLink href={DISCORD_INVITE_URL}>
                {t("publicSite.discord")}
              </FooterExternalLink>
            </li>
            <li>
              <FooterExternalLink href={GITHUB_ORG_URL}>
                {t("publicSite.github")}
              </FooterExternalLink>
            </li>
            <li>
              <FooterExternalLink href={USERJOT_BOARD_URL}>
                {t("publicSite.feedback")}
              </FooterExternalLink>
            </li>
            <li>
              <Link className={internalLinkClass} to="/privacy">
                {t("publicSite.privacy")}
              </Link>
            </li>
            <li>
              <Link className={internalLinkClass} to="/terms">
                {t("publicSite.terms")}
              </Link>
            </li>
            {isUiKitEnabled ? (
              <li>
                <Link className={internalLinkClass} to="/ui-kit">
                  {t("publicSite.uiKit")}
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
