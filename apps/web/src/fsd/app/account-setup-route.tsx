import { Navigate, useNavigate, useSearchParams } from "react-router"

import {
  AccountSetupScreen,
  type AccountSetupStep,
} from "@/features/account-onboarding"
import { useCurrentUser } from "@/entities/account"

import { SETUP_STEP_PATHS } from "./account-setup-routes"
import { resolveNextPath } from "./resolve-next-path"
import { SetupV1Import } from "./setup-v1-import"

/**
 * Hosts the account setup screen at one of its addresses, and owns the two things the screen itself
 * must not: the reverse guard, and step navigation.
 *
 * The reverse guard only fires on a definitive answer — a successful current-user request reporting
 * onboarding complete. While the request is loading, or if it failed, it deliberately does nothing:
 * `OnboardingGate` sends unconfigured users here and this sends configured users away, so acting on
 * an indeterminate state would let the two bounce a user between them indefinitely.
 *
 * It is also what completes setup. A form that navigated on its own submit would race the
 * fire-and-forget current-user refetch and land on a route whose gate still reads the stale
 * `hasCompletedOnboarding: false`; waiting for the refreshed state here removes that race.
 */
export function AccountSetupRoute({ step }: { step: AccountSetupStep }) {
  const { state } = useCurrentUser()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const next = searchParams.get("next")

  if (state.status === "success" && state.user.hasCompletedOnboarding) {
    return <Navigate replace to={resolveNextPath(next)} />
  }

  // Carried across step navigation so the remembered destination survives Back, the mobile
  // "paste a key instead" shortcut, and a reload.
  const search = next ? `?next=${encodeURIComponent(next)}` : ""

  return (
    <AccountSetupScreen
      onStepChange={(nextStep) => {
        void navigate(`${SETUP_STEP_PATHS[nextStep]}${search}`)
      }}
      renderImportStep={(onCompleted) => (
        <SetupV1Import
          onCompleted={onCompleted}
          onUseApiKey={() => void navigate(`${SETUP_STEP_PATHS.key}${search}`)}
        />
      )}
      step={step}
    />
  )
}
