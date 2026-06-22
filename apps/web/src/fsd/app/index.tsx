import { UiKitPage } from "@/pages/ui-kit"
import { Toaster } from "@workspace/ui/components/sonner"

import { AuthControl } from "./providers/auth-control"
import { LanguageSwitcher } from "./providers/language-switcher"
import { ThemeSwitcher } from "./providers/theme-switcher"
import { TourButton } from "./providers/tour-button"
import { useTheme } from "./providers/theme-provider"

export function App() {
  const { theme } = useTheme()

  return (
    <>
      <UiKitPage
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <AuthControl />
            <TourButton />
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        }
      />
      <Toaster theme={theme} />
    </>
  )
}
