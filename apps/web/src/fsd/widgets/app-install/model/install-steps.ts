import type { InstallPlatform } from "./install-platform"

export type InstallStepIcon =
  "share" | "addToHome" | "menu" | "install" | "confirm"

const STEPS = {
  ios: [
    { key: "appInstall.steps.ios.share", icon: "share" },
    { key: "appInstall.steps.ios.add", icon: "addToHome" },
    { key: "appInstall.steps.ios.confirm", icon: "confirm" },
  ],
  macSafari: [
    { key: "appInstall.steps.macSafari.addToDock", icon: "addToHome" },
    { key: "appInstall.steps.macSafari.confirm", icon: "confirm" },
  ],
  android: [
    { key: "appInstall.steps.android.menu", icon: "menu" },
    { key: "appInstall.steps.android.install", icon: "addToHome" },
    { key: "appInstall.steps.android.confirm", icon: "confirm" },
  ],
  desktop: [
    { key: "appInstall.steps.desktop.menu", icon: "install" },
    { key: "appInstall.steps.desktop.install", icon: "addToHome" },
    { key: "appInstall.steps.desktop.confirm", icon: "confirm" },
  ],
} as const satisfies Record<
  Exclude<InstallPlatform, "unsupported">,
  { key: `appInstall.steps.${string}`; icon: InstallStepIcon }[]
>

export type InstallStep = (typeof STEPS)[keyof typeof STEPS][number]

/** The manual install steps for a platform, empty where the browser cannot install web apps. */
export function installSteps(
  platform: InstallPlatform
): readonly InstallStep[] {
  return platform === "unsupported" ? [] : STEPS[platform]
}
