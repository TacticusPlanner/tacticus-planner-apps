import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
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

const themeOptions: {
  value: Theme
  icon: LucideIcon
  labelKey: "theme.light" | "theme.dark" | "theme.system"
}[] = [
  { value: "light", icon: Sun, labelKey: "theme.light" },
  { value: "dark", icon: Moon, labelKey: "theme.dark" },
  { value: "system", icon: Monitor, labelKey: "theme.system" },
]

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const ActiveIcon =
    themeOptions.find((option) => option.value === theme)?.icon ?? Monitor

  return (
    <Select onValueChange={(value) => setTheme(value as Theme)} value={theme}>
      <SelectTrigger
        aria-label={t("theme.label")}
        data-testid="theme-switcher"
        size="sm"
      >
        <ActiveIcon data-icon="inline-start" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {themeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <option.icon />
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
