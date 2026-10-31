import { useState, type ReactNode } from "react"
import {
  Download,
  LoaderCircle,
  LogOut,
  MapIcon,
  MessageSquareText,
  MonitorSmartphone,
  Newspaper,
  User,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import type { SignInMethod } from "@/shared/auth"

import { AccountAvatar } from "./account-avatar"
import {
  CommunitySection,
  LanguagePickerView,
  LegalLinks,
  MenuLinkRow,
  MenuRow,
  MenuSection,
  PreferencesSection,
  UnreadDot,
  type AccountMenuView,
} from "./account-menu-parts"
import { CatalogSyncStatusBadge } from "./catalog-sync-status-badge"
import { EditDisplayNameButton } from "./edit-display-name-button"
import { USERJOT_ROADMAP_URL } from "../model/userjot-links"

/** Signed-in account card, shared by the desktop popover and the mobile drawer: identity header, then labelled
 *  Preferences, Account, Help & feedback and Community groups, sign out, and the legal links and game catalog
 *  status as a quiet footer. Language opens an
 *  in-card sub-view; the view resets because the card unmounts whenever the popover closes. */
export function AccountCard({
  accountEmail,
  accountName,
  applicationAccountId,
  canEditName,
  className,
  identityPending = false,
  onEditName,
  onFeedback,
  onChangelog,
  changelogUnread = false,
  feedbackUnavailable,
  onImportV1,
  onInstallApp,
  onOpenAccountSettings,
  onExternalLink,
  onSignOut,
  signInMethod,
  signOutDisabled,
  tourRow,
}: {
  /** Null for a Google account whose token carries no `email` claim: its username is a generated id. */
  accountEmail: string | null
  accountName: string
  applicationAccountId: string | null
  canEditName: boolean
  className?: string
  /** /account has not answered yet: show a loading identity instead of the neutral label and email. */
  identityPending?: boolean
  onEditName: () => void
  onFeedback: () => void
  /** Opens the widget's Updates, so reading there clears the feedback button's unread dot. */
  onChangelog: () => void
  /** The widget reports unread activity: mark the Changelog row with a dot. */
  changelogUnread?: boolean
  /** Why the feedback row is disabled (the widget failed to load), or undefined when it works. */
  feedbackUnavailable?: string
  onImportV1: () => void
  /** Opens the install guide; the row is left out where the app is installed or cannot be. */
  onInstallApp?: () => void
  onOpenAccountSettings: () => void
  /** Closes the menu when a row leaves it (Roadmap, Discord, Buy Me a Coffee, Privacy & cookies, Terms of use). */
  onExternalLink?: () => void
  onSignOut: () => void
  signInMethod: SignInMethod
  signOutDisabled: boolean
  /** Extra row after Send feedback (the mobile drawer has no rail, so it adds the tour here). */
  tourRow?: ReactNode
}) {
  const { t } = useTranslation()
  const [view, setView] = useState<AccountMenuView>("main")
  const back = () => setView("main")

  if (view === "language") return <LanguagePickerView onBack={back} />

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="flex items-center gap-3"
        data-testid="auth-account-identity"
      >
        <AccountAvatar
          applicationAccountId={applicationAccountId}
          className="size-10 shrink-0 text-base"
          displayName={accountName}
          pending={identityPending}
        />
        {identityPending ? (
          <div
            className="flex min-w-0 flex-1 flex-col gap-1.5"
            data-testid="auth-account-identity-loading"
            role="status"
          >
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <LoaderCircle
                className="size-3 animate-spin"
                aria-hidden="true"
              />
              {t("auth.accountLoading")}
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-left leading-tight">
            <div className="truncate font-medium" title={accountName}>
              {accountName}
            </div>
            {accountEmail ? (
              <div
                className="truncate text-xs text-muted-foreground"
                title={accountEmail}
              >
                {accountEmail}
              </div>
            ) : null}
            <div
              className="truncate text-xs text-muted-foreground"
              data-testid="auth-account-sign-in-method"
            >
              {t(`auth.signedInWith.${signInMethod}`)}
            </div>
          </div>
        )}
        {canEditName ? <EditDisplayNameButton onClick={onEditName} /> : null}
      </div>
      <Separator />
      <PreferencesSection onOpenLanguage={() => setView("language")} />
      <Separator />
      <MenuSection
        data-testid="account-section"
        label={t("auth.accountSection")}
      >
        <MenuRow
          data-testid="auth-manage-account"
          icon={User}
          label={t("auth.accountSettings")}
          onClick={onOpenAccountSettings}
        />
        <MenuRow
          data-testid="auth-v1-import"
          icon={Download}
          label={t("goals.v1Import.menu")}
          onClick={onImportV1}
        />
        {onInstallApp ? (
          <MenuRow
            data-testid="auth-install-app"
            icon={MonitorSmartphone}
            label={t("appInstall.menu")}
            onClick={onInstallApp}
          />
        ) : null}
      </MenuSection>
      <Separator />
      <MenuSection data-testid="account-help" label={t("feedback.section")}>
        <MenuRow
          data-testid="auth-feedback"
          disabled={Boolean(feedbackUnavailable)}
          icon={MessageSquareText}
          label={t("feedback.send")}
          onClick={onFeedback}
          title={feedbackUnavailable}
        />
        {tourRow}
        <MenuLinkRow
          data-testid="auth-roadmap"
          onClick={onExternalLink}
          href={USERJOT_ROADMAP_URL}
          icon={MapIcon}
          label={t("feedback.roadmap")}
        />
        <MenuRow
          data-testid="auth-changelog"
          disabled={Boolean(feedbackUnavailable)}
          icon={Newspaper}
          label={t("feedback.changelog")}
          onClick={onChangelog}
          title={feedbackUnavailable}
          trailing={
            changelogUnread ? (
              <UnreadDot data-testid="auth-changelog-unread-indicator" />
            ) : undefined
          }
        />
      </MenuSection>
      <Separator />
      <CommunitySection onNavigate={onExternalLink} />
      <Separator />
      <MenuRow
        className="text-destructive hover:text-destructive"
        data-testid="auth-sign-out"
        disabled={signOutDisabled}
        icon={LogOut}
        label={t("auth.signOut")}
        onClick={onSignOut}
      />
      <LegalLinks onNavigate={onExternalLink} />
      <CatalogSyncStatusBadge plain />
    </div>
  )
}
