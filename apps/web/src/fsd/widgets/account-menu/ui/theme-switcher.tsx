import type { LucideIcon } from "lucide-react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { useTheme, type Theme } from "@/shared/theme"

const themeOptions: {
  value: Theme
  icon: LucideIcon
  labelKey: "theme.light" | "theme.system" | "theme.dark"
}[] = [
  { value: "light", icon: Sun, labelKey: "theme.light" },
  { value: "system", icon: Monitor, labelKey: "theme.system" },
  { value: "dark", icon: Moon, labelKey: "theme.dark" },
]

export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      aria-label={t("theme.label")}
      className={className}
      data-testid="theme-switcher"
      onValueChange={(value) => {
        // Radix emits "" when the already-pressed item is clicked again in a single-select
        // group; ignore it so the toggle can't be driven to an unset state.
        if (value) {
          setTheme(value as Theme)
        }
      }}
      spacing={0}
      type="single"
      value={theme}
      variant="outline"
    >
      {themeOptions.map(({ value, icon: Icon, labelKey }) => (
        <ToggleGroupItem
          aria-label={t(labelKey)}
          className="flex-1"
          key={value}
          size="sm"
          value={value}
        >
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
