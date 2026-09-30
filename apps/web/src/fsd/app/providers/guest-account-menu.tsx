import { useState, type ReactNode } from "react"
import { LogIn, MapIcon, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Separator } from "@workspace/ui/components/separator"
import { USERJOT_ROADMAP_URL } from "./userjot-provider"

import {
  LanguagePickerView,
  MenuLinkRow,
  PreferencesSection,
  type AccountMenuView,
} from "./account-menu-parts"

/** Signed-out desktop preferences: theme selection plus the existing sign-in action. */
/** Guest Preferences (theme, language), the Roadmap row, and caller-supplied extra content
 *  (sign-in on desktop, the tour on mobile). Language opens an in-card picker; the view resets
 *  because popover content unmounts on close. */
export function GuestPreferencesCard({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
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
          <GuestPreferencesCard>
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
