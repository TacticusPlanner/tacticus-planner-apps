import { Moon, Sun } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { useTheme } from "./theme-provider"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
      {isDark ? "Light" : "Dark"}
    </Button>
  )
}
