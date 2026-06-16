import { UiKitPage } from "@/pages/ui-kit"

import { ThemeSwitcher } from "./providers/theme-switcher"

export function App() {
  return <UiKitPage headerAction={<ThemeSwitcher />} />
}
