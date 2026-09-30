import type { ReactNode } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Languages,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { supportedLocales } from "@/shared/config"

import { ThemeSwitcher } from "./theme-switcher"
import { useLanguage } from "./use-language"

export type AccountMenuView = "main" | "language"

const menuRowClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

/** Menu row that opens an external page in a new tab (used for the public roadmap). */
export function MenuLinkRow({
  href,
  icon: Icon,
  label,
  ...props
}: Omit<React.ComponentProps<"a">, "children"> & {
  href: string
  icon: LucideIcon
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

/** One full-width row of the desktop account card; `chevron` marks rows that open a sub-view. */
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
    <section
      aria-label={t("auth.preferences")}
      className="flex flex-col gap-0.5"
      data-testid="account-preferences"
    >
      <h3 className="px-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {t("auth.preferences")}
      </h3>
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
    </section>
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
