import { useMemo, useState, useSyncExternalStore } from "react"

import {
  storedPreference,
  useStoredPreference,
  writePreference,
} from "@/shared/lib"

import { detectInstallPlatform, isRunningInstalled } from "./install-platform"
import type { InstallPlatform } from "./install-platform"
import {
  getInstallPromptState,
  subscribeInstallPrompt,
} from "./install-prompt-store"

// When the Home card was dismissed (an ISO date); unset while it has not been.
const CARD_DISMISSED = storedPreference("dismissed", "appInstallCard")
const isDismissed = (stored: unknown) => stored !== undefined

export type AppInstallState = {
  platform: InstallPlatform
  /** Running as the installed app: nothing to offer. */
  installed: boolean
  /** The app was installed during this visit, so the shortcuts tip can follow. */
  justInstalled: boolean
  /** The browser's own install prompt is ready for the Install button. */
  canPrompt: boolean
  /** The install guide has something to show: a prompt, or manual steps for this platform. */
  canInstall: boolean
  /** The Home card is shown: the user has not dismissed it, and installing is one tap (a prompt)
   *  or a browser with no prompt at all (Safari), where the guide is the only way in. A
   *  Chromium browser without a prompt has most likely installed the app already. */
  showCard: boolean
  dismissCard: () => void
}

export function useAppInstall(): AppInstallState {
  const { canPrompt, justInstalled } = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptState
  )
  const [installed] = useState(isRunningInstalled)
  const platform = useMemo(
    () => detectInstallPlatform(navigator.userAgent, navigator.maxTouchPoints),
    []
  )
  const [cardDismissed] = useStoredPreference(CARD_DISMISSED, isDismissed)

  const canInstall = !installed && (canPrompt || platform !== "unsupported")
  const needsGuide = platform === "ios" || platform === "macSafari"

  return {
    platform,
    installed,
    justInstalled,
    canPrompt,
    canInstall,
    showCard:
      !installed &&
      !cardDismissed &&
      (justInstalled || canPrompt || needsGuide),
    dismissCard: () => {
      writePreference(CARD_DISMISSED, new Date().toISOString())
    },
  }
}
