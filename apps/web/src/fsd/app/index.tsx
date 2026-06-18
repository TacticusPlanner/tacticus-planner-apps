import { UiKitPage } from "@/pages/ui-kit"
import { Toaster } from "@workspace/ui/components/sonner"

import { ThemeSwitcher } from "./providers/theme-switcher"
import { useTheme } from "./providers/theme-provider"

export function App() {
  const { theme } = useTheme()

  return (
    <>
      <UiKitPage headerAction={<ThemeSwitcher />} />
      <Toaster theme={theme} />
    </>
  )
}
