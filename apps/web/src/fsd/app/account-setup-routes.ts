import type { AccountSetupStep } from "@/features/account-onboarding"

export const SETUP_STEP_PATHS: Record<AccountSetupStep, string> = {
  choose: "/setup",
  key: "/setup/key",
  import: "/setup/import",
}

/**
 * One address per mobile step, so Back moves between steps, a reload keeps the step, and each step
 * is reported as its own page-view. `routes.tsx` wraps each in the authentication-only guard.
 *
 * Kept out of `account-setup-route.tsx` so that module only exports its component (Fast Refresh).
 */
export const accountSetupRoutes = (
  Object.keys(SETUP_STEP_PATHS) as AccountSetupStep[]
).map((step) => ({ path: SETUP_STEP_PATHS[step], step }))
