import type { AppEnvironment } from "@/shared/config"

/** Staging builds say so beside the logo; local and production builds carry the beta mark. */
export function environmentBadgeLabelKey(environment: AppEnvironment) {
  return environment === "staging" ? "app.staging" : "app.beta"
}
