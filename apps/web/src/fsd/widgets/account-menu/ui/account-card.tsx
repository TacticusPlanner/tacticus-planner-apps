import { useState, type ReactNode } from "react"
import {
  Download,
  LoaderCircle,
  LogOut,
  MapIcon,
  MessageSquareText,
  Newspaper,
  User,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

import { AccountAvatar } from "./account-avatar"
import {
  LanguagePickerView,
  MenuLinkRow,
  MenuRow,
  PreferencesSection,
  UnreadDot,
  type AccountMenuView,
} from "./account-menu-parts"
import { CatalogSyncStatusBadge } from "./catalog-sync-status-badge"
import { EditDisplayNameButton } from "./edit-display-name-button"
import { USERJOT_ROADMAP_URL } from "../model/userjot-links"

/** Signed-in account card, shared by the desktop popover and the mobile drawer: identity header, preferences, account/import/feedback rows,
 *  sign out, and the game catalog status as a quiet footer. Language opens an
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
  onOpenAccountSettings,
  onExternalLink,
  onSignOut,
  signOutDisabled,
  tourRow,
}: {
  accountEmail: string
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
  onOpenAccountSettings: () => void
  onExternalLink?: () => void
  onSignOut: () => void
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
            <div
              className="truncate text-xs text-muted-foreground"
              title={accountEmail}
            >
              {accountEmail}
            </div>
          </div>
        )}
        {canEditName ? <EditDisplayNameButton onClick={onEditName} /> : null}
      </div>
      <Separator />
      <PreferencesSection onOpenLanguage={() => setView("language")} />
      <Separator />
      <div className="flex flex-col gap-0.5">
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
      </div>
      <Separator />
      <MenuRow
        className="text-destructive hover:text-destructive"
        data-testid="auth-sign-out"
        disabled={signOutDisabled}
        icon={LogOut}
        label={t("auth.signOut")}
        onClick={onSignOut}
      />
      <CatalogSyncStatusBadge plain />
    </div>
  )
}
