import { Languages } from "lucide-react"
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

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)

  const handleLanguageChange = (nextLanguage: SupportedLanguage) => {
    void i18n.changeLanguage(nextLanguage)
  }

  return (
    <Select onValueChange={handleLanguageChange} value={language}>
      <SelectTrigger
        aria-label={t("language.label")}
        className={className}
        data-testid="language-switcher"
        size="sm"
      >
        <Languages data-icon="inline-start" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {supportedLocales.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
              {t(locale.labelKey)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
