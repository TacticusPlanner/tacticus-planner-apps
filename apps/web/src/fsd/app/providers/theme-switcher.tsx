import type { LucideIcon } from "lucide-react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { useTheme, type Theme } from "@/shared/theme"

const themeIcons: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const Icon = themeIcons[theme]

  return (
    <Select onValueChange={(value) => setTheme(value as Theme)} value={theme}>
      <SelectTrigger
        aria-label={t("theme.label")}
        className={className}
        data-testid="theme-switcher"
        size="sm"
      >
        <Icon data-icon="inline-start" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="light">{t("theme.light")}</SelectItem>
          <SelectItem value="dark">{t("theme.dark")}</SelectItem>
          <SelectItem value="system">{t("theme.system")}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
