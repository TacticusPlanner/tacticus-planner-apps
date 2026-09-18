import { useId } from "react"
import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  getSupportedLanguage,
  supportedLocales,
  type SupportedLanguage,
} from "@/shared/config"

export function LanguageSwitcher({
  className,
  showNativeName = false,
}: {
  className?: string
  /** Set on a surface with room to spare (the full-width account drawer) to show the
   *  active language's native name next to its code. Compact mounts show the code alone. */
  showNativeName?: boolean
}) {
  const { i18n, t } = useTranslation()
  const valueId = useId()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
  const selectedLocale = supportedLocales.find(
    (locale) => locale.code === language
  )

  const handleLanguageChange = (nextLanguage: SupportedLanguage) => {
    void i18n.changeLanguage(nextLanguage)
  }

  return (
    <Select onValueChange={handleLanguageChange} value={language}>
      <SelectTrigger
        aria-describedby={valueId}
        aria-label={t("language.label")}
        className={className}
        data-testid="language-switcher"
        size="sm"
      >
        <SelectValue>
          <span
            className="flex items-center gap-2"
            data-testid="language-switcher-value"
          >
            <span className="font-medium">{language.toUpperCase()}</span>
            {showNativeName ? <span>{selectedLocale?.nativeName}</span> : null}
          </span>
        </SelectValue>
        {/* `aria-label` names the control, so the trigger's own text never reaches the
            accessibility tree - this carries the selected language as its description. */}
        <span className="sr-only" id={valueId}>
          {selectedLocale?.nativeName}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {supportedLocales.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
              <span className="font-medium">{locale.code.toUpperCase()}</span>
              {locale.nativeName}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
