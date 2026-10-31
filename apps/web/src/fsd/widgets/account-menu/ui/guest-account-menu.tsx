import { useState, type ReactNode } from "react"
import { MapIcon, Newspaper, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { USERJOT_ROADMAP_URL } from "../model/userjot-links"

import {
  CommunitySection,
  LanguagePickerView,
  LegalLinks,
  MenuLinkRow,
  MenuRow,
  MenuSection,
  PreferencesSection,
  type AccountMenuView,
} from "./account-menu-parts"

/** Guest Preferences (theme, language), Help & feedback (the tour on mobile, Roadmap, Changelog), Community,
 *  caller-supplied extra content, and the legal links as a footer. Language opens an in-card picker; the view
 *  resets because popover content unmounts on close. */
export function GuestPreferencesCard({
  children,
  changelogUnavailable,
  onChangelog,
  tourRow,
}: {
  children?: ReactNode
  /** Why the Changelog row is disabled (the widget failed to load), or undefined when it works. */
  changelogUnavailable?: string
  /** Opens the widget's Updates (and closes the surrounding menu), so reading there clears the unread dot.
   *  Omitted outside the app shell (public pages), where the UserJot widget is not mounted: no Changelog row. */
  onChangelog?: () => void
  /** First Help & feedback row (the mobile header has no rail, so it adds the tour here). */
  tourRow?: ReactNode
}) {
  const { t } = useTranslation()
  const [view, setView] = useState<AccountMenuView>("main")

  if (view === "language") {
    return <LanguagePickerView onBack={() => setView("main")} />
  }

  return (
    <>
      <PreferencesSection onOpenLanguage={() => setView("language")} />
      <MenuSection data-testid="account-help" label={t("feedback.section")}>
        {tourRow}
        <MenuLinkRow
          data-testid="auth-roadmap"
          href={USERJOT_ROADMAP_URL}
          icon={MapIcon}
          label={t("feedback.roadmap")}
        />
        {onChangelog ? (
          <MenuRow
            data-testid="auth-changelog"
            disabled={Boolean(changelogUnavailable)}
            icon={Newspaper}
            label={t("feedback.changelog")}
            onClick={onChangelog}
            title={changelogUnavailable}
          />
        ) : null}
      </MenuSection>
      <CommunitySection />
      {children}
      <LegalLinks />
    </>
  )
}

/** Signed-out desktop preferences behind the top bar's gear. Sign in and Sign up sit beside it in the
 *  bar (`GuestAuthButtons`), not inside, so a guest never has to open Settings to find them. */
export function GuestAccountMenu({
  changelogUnavailable,
  onChangelog,
  onOpenChange,
  open,
}: {
  changelogUnavailable?: string
  onChangelog: () => void
  onOpenChange: (open: boolean) => void
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
          <GuestPreferencesCard
            changelogUnavailable={changelogUnavailable}
            onChangelog={() => {
              onOpenChange(false)
              onChangelog()
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
