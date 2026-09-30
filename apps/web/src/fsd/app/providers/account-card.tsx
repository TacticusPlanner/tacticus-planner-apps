import { useState, type ReactNode } from "react"
import {
  Download,
  LogOut,
  MapIcon,
  MessageSquareText,
  User,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import { AccountAvatar } from "./account-avatar"
import {
  LanguagePickerView,
  MenuLinkRow,
  MenuRow,
  PreferencesSection,
  type AccountMenuView,
} from "./account-menu-parts"
import { CatalogSyncStatusBadge } from "./catalog-sync-status-badge"
import { EditDisplayNameButton } from "./edit-display-name-button"
import { USERJOT_ROADMAP_URL } from "./userjot-provider"

/** Signed-in account card, shared by the desktop popover and the mobile drawer: identity header, preferences, account/import/feedback rows,
 *  sign out, and the game catalog status as a quiet footer. Language opens an
 *  in-card sub-view; the view resets because the card unmounts whenever the popover closes. */
export function AccountCard({
  accountEmail,
  accountName,
  applicationAccountId,
  canEditName,
  className,
  onEditName,
  onFeedback,
  onImportV1,
  onOpenAccountSettings,
  onRoadmap,
  onSignOut,
  signOutDisabled,
  tourRow,
}: {
  accountEmail: string
  accountName: string
  applicationAccountId: string | null
  canEditName: boolean
  className?: string
  onEditName: () => void
  onFeedback: () => void
  onImportV1: () => void
  onOpenAccountSettings: () => void
  onRoadmap?: () => void
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
        />
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
          icon={MessageSquareText}
          label={t("feedback.send")}
          onClick={onFeedback}
        />
        {tourRow}
        <MenuLinkRow
          data-testid="auth-roadmap"
          onClick={onRoadmap}
          href={USERJOT_ROADMAP_URL}
          icon={MapIcon}
          label={t("feedback.roadmap")}
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
