import { useState, type ReactNode } from "react"
import { LogIn, MapIcon, Newspaper, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Separator } from "@workspace/ui/components/separator"
import { USERJOT_ROADMAP_URL, useUserJot } from "./userjot-provider"

import {
  LanguagePickerView,
  MenuLinkRow,
  MenuRow,
  PreferencesSection,
  type AccountMenuView,
} from "./account-menu-parts"

/** Signed-out desktop preferences: theme selection plus the existing sign-in action. */
/** Guest Preferences (theme, language), the Roadmap and Changelog rows, and caller-supplied extra content
 *  (sign-in on desktop, the tour on mobile). Language opens an in-card picker; the view resets
 *  because popover content unmounts on close. */
export function GuestPreferencesCard({
  children,
  onOpenWidget,
}: {
  children?: ReactNode
  /** Closes the surrounding menu before the UserJot widget opens over it. */
  onOpenWidget?: () => void
}) {
  const { t } = useTranslation()
  const { open: openUserJot, status: feedbackStatus } = useUserJot()
  const [view, setView] = useState<AccountMenuView>("main")

  if (view === "language") {
    return <LanguagePickerView onBack={() => setView("main")} />
  }

  return (
    <>
      <PreferencesSection onOpenLanguage={() => setView("language")} />
      <MenuLinkRow
        data-testid="auth-roadmap"
        href={USERJOT_ROADMAP_URL}
        icon={MapIcon}
        label={t("feedback.roadmap")}
      />
      <MenuRow
        data-testid="auth-changelog"
        disabled={feedbackStatus === "failed"}
        icon={Newspaper}
        label={t("feedback.changelog")}
        onClick={() => {
          onOpenWidget?.()
          openUserJot({ to: "updates" })
        }}
        title={
          feedbackStatus === "failed"
            ? t("nav.quickActions.feedbackUnavailable")
            : undefined
        }
      />
      {children}
    </>
  )
}

export function GuestAccountMenu({
  checkingSignIn,
  disabled,
  onOpenChange,
  onSignIn,
  open,
}: {
  checkingSignIn: boolean
  disabled: boolean
  onOpenChange: (open: boolean) => void
  onSignIn: () => void
  open: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center" data-testid="auth-account">
      <Popover onOpenChange={onOpenChange} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-label={t("settings.label")}
            className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            data-testid="auth-guest-trigger"
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
          <GuestPreferencesCard onOpenWidget={() => onOpenChange(false)}>
            <Separator />
            <Button
              data-testid="auth-sign-in"
              disabled={disabled}
              onClick={onSignIn}
              size="sm"
            >
              <LogIn data-icon="inline-start" />
              {checkingSignIn ? t("auth.checkingSignIn") : t("auth.signIn")}
            </Button>
          </GuestPreferencesCard>
        </PopoverContent>
      </Popover>
    </div>
  )
}
