import { useState } from "react"

import { useAnalyticsActions } from "@/shared/analytics"

import {
  promptInstall,
  type InstallPromptOutcome,
} from "./install-prompt-store"
import type { AppInstallState } from "./use-app-install"

export type AppInstallSource = "homeCard" | "accountMenu"

/** Open state of the install guide plus the two ways in: the guide itself, and the browser's
 *  one-tap prompt. Both report which surface (`source`) they came from. */
export function useInstallGuide(
  source: AppInstallSource,
  install: Pick<AppInstallState, "platform" | "canPrompt">
) {
  const { captureEvent } = useAnalyticsActions()
  const [guideOpen, setGuideOpen] = useState(false)

  const openGuide = () => {
    captureEvent({
      type: "app_install_guide_opened",
      source,
      platform: install.platform,
      canPrompt: install.canPrompt,
    })
    setGuideOpen(true)
  }

  const runPrompt = async (): Promise<InstallPromptOutcome> => {
    const outcome = await promptInstall()
    if (outcome !== "unavailable") {
      captureEvent({ type: "app_install_prompt_answered", source, outcome })
    }
    return outcome
  }

  return { guideOpen, setGuideOpen, openGuide, runPrompt }
}
