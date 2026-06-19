import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"

import { useTheme } from "./theme-provider"

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      data-testid="theme-switcher"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      size="sm"
      variant="outline"
    >
      {isDark ? (
        <Sun data-icon="inline-start" />
      ) : (
        <Moon data-icon="inline-start" />
      )}
      {isDark ? t("theme.light") : t("theme.dark")}
    </Button>
  )
}
