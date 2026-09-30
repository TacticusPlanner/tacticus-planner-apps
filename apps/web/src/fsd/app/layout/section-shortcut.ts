import { isMacPlatform } from "./is-mac-platform"

/** Platform-aware hint and ARIA value for the Ctrl/Cmd+B section menu shortcut. */
export function sectionShortcut() {
  const mac = isMacPlatform()

  return {
    hint: mac ? "⌘B" : "Ctrl+B",
    aria: mac ? "Meta+B" : "Control+B",
  }
}
