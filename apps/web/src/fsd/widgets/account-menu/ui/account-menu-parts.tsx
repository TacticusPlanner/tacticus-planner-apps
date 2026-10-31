import type { ComponentType, ReactNode } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  ExternalLink,
  Languages,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  BUY_ME_A_COFFEE_URL,
  DISCORD_INVITE_URL,
  supportedLocales,
} from "@/shared/config"

import { DiscordIcon } from "./discord-icon"
import { ThemeSwitcher } from "./theme-switcher"
import { useLanguage } from "../model/use-language"

export type AccountMenuView = "main" | "language"

const menuRowClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

/** Menu row that opens an external page in a new tab (Roadmap, Discord, Buy Me a Coffee). */
export function MenuLinkRow({
  href,
  icon: Icon,
  label,
  ...props
}: Omit<React.ComponentProps<"a">, "children"> & {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <a
      className={menuRowClass}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ExternalLink
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
    </a>
  )
}

/** A labelled group of menu rows; the heading matches the Preferences one. */
export function MenuSection({
  children,
  label,
  ...props
}: Omit<React.ComponentProps<"section">, "aria-label"> & { label: string }) {
  return (
    <section aria-label={label} className="flex flex-col gap-0.5" {...props}>
      <h3 className="px-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </h3>
      {children}
    </section>
  )
}

/** Community section: the Discord server and the Buy Me a Coffee page. `onNavigate` closes the surrounding menu. */
export function CommunitySection({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()

  return (
    <MenuSection data-testid="account-community" label={t("community.title")}>
      <MenuLinkRow
        data-testid="account-discord"
        href={DISCORD_INVITE_URL}
        icon={DiscordIcon}
        label={t("community.discord")}
        onClick={onNavigate}
      />
      <MenuLinkRow
        data-testid="account-buy-me-a-coffee"
        href={BUY_ME_A_COFFEE_URL}
        icon={Coffee}
        label={t("community.buyMeACoffee")}
        onClick={onNavigate}
      />
    </MenuSection>
  )
}

const legalLinkClass =
  "rounded-sm outline-hidden hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"

/** Privacy & cookies and Terms of use as a quiet footer line, so the legal pages are reachable from inside the app
 *  (the public footer that links them is only on the public pages). `onNavigate` closes the surrounding menu. */
export function LegalLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t("community.legal")}
      className="flex flex-wrap items-center gap-x-2 px-2 text-xs text-muted-foreground"
    >
      <Link
        className={legalLinkClass}
        data-testid="account-privacy"
        onClick={onNavigate}
        to="/privacy"
      >
        {t("publicSite.privacy")}
      </Link>
      <span aria-hidden="true">·</span>
      <Link
        className={legalLinkClass}
        data-testid="account-terms"
        onClick={onNavigate}
        to="/terms"
      >
        {t("publicSite.terms")}
      </Link>
    </nav>
  )
}

/** Small red dot marking unread activity, matching the feedback button's indicator. */
export function UnreadDot({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn("block size-2 rounded-full bg-destructive", className)}
      {...props}
    />
  )
}

/** One full-width row of the account card; `chevron` marks rows that open a sub-view. */
export function MenuRow({
  chevron,
  className,
  icon: Icon,
  label,
  trailing,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  chevron?: boolean
  icon?: LucideIcon
  label: string
  trailing?: ReactNode
}) {
  return (
    <button
      aria-label={label}
      data-slot="menu-row"
      className={cn(menuRowClass, className)}
      type="button"
      {...props}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {trailing}
        </span>
      ) : null}
      {chevron ? (
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      ) : null}
    </button>
  )
}

/** Theme switch plus a Language row that opens the language picker view. */
export function PreferencesSection({
  onOpenLanguage,
}: {
  onOpenLanguage: () => void
}) {
  const { t } = useTranslation()
  const { selectedLocale } = useLanguage()

  return (
    <MenuSection
      data-testid="account-preferences"
      label={t("auth.preferences")}
    >
      <div className="flex items-center justify-between gap-3 px-2 py-1">
        <span className="text-sm">{t("theme.label")}</span>
        <ThemeSwitcher />
      </div>
      <MenuRow
        chevron
        data-testid="account-language-row"
        icon={Languages}
        label={t("language.label")}
        onClick={onOpenLanguage}
        trailing={selectedLocale?.nativeName}
      />
    </MenuSection>
  )
}

/** Sub-view shell: a back button and title above the view's content. */
function MenuSubView({
  children,
  onBack,
  title,
}: {
  children: ReactNode
  onBack: () => void
  title: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-1" data-testid="account-menu-subview">
      <div className="flex items-center gap-1">
        <Button
          aria-label={t("common.back")}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- the sub-view replaces the focused menu row, so focus must move into it.
          autoFocus
          data-testid="account-menu-back"
          onClick={onBack}
          size="icon-sm"
          variant="ghost"
        >
          <ChevronLeft />
        </Button>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export function LanguagePickerView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const { language, setLanguage } = useLanguage()

  return (
    <MenuSubView onBack={onBack} title={t("language.label")}>
      <div
        aria-label={t("language.label")}
        className="flex flex-col gap-0.5"
        data-testid="account-language-picker"
        role="radiogroup"
      >
        {supportedLocales.map((locale) => (
          <MenuRow
            aria-checked={locale.code === language}
            data-testid={`account-language-${locale.code}`}
            key={locale.code}
            label={locale.nativeName}
            onClick={() => {
              setLanguage(locale.code)
              onBack()
            }}
            role="radio"
            trailing={
              locale.code === language ? (
                <Check aria-hidden="true" className="size-4" />
              ) : undefined
            }
          />
        ))}
      </div>
    </MenuSubView>
  )
}
