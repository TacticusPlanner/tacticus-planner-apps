import { useMemo, useState, useSyncExternalStore } from "react"

import { safeStorage } from "@/shared/lib"

import {
  detectInstallPlatform,
  isRunningInstalled,
  type InstallPlatform,
} from "./install-platform"
import {
  getInstallPromptState,
  subscribeInstallPrompt,
} from "./install-prompt-store"

const CARD_DISMISSED_KEY = "app-install-card-dismissed"

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
  const [cardDismissed, setCardDismissed] = useState(
    () => safeStorage.get(CARD_DISMISSED_KEY) !== null
  )

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
      safeStorage.set(CARD_DISMISSED_KEY, new Date().toISOString())
      setCardDismissed(true)
    },
  }
}
