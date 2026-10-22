import { useReducer } from "react"
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router"

import {
  AccountSetupScreen,
  type AccountSetupStep,
} from "@/features/account-onboarding"
import { useCurrentUser } from "@/entities/account"

import { SETUP_STEP_PATHS } from "./account-setup-routes"
import { arrivalPath } from "./arrival-path"
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
 *
 * The import step suppresses this guard until its own Continue is clicked (`importAwaitingContinue`,
 * one field of the `setupFlowReducer` state below).
 * `hasCompletedOnboarding` flips true server-side the moment the personal key alone is saved — the
 * *first* submit, well before Continue ever appears — and this guard's `useCurrentUser()` is one of
 * several concurrently-mounted subscribers to that same shared query (the screen itself, this route,
 * `PostHogIdentity`'s analytics identity effect). `staleTime: 0` makes any of them eligible to
 * trigger a background refetch on its own terms; if the one that fires happens to land after the key
 * is already saved, this guard used to redirect away right then, regardless of whether the user had
 * asked to move on. Gating on the explicit Continue click — not on chasing down every possible
 * refetch source — is what actually closes that off.
 */
export function AccountSetupRoute({ step }: { step: AccountSetupStep }) {
  // Keyed by `step` so `importAwaitingContinue` below gets a fresh `useReducer` initializer on every
  // step transition. Each step maps to its own <Route>, but react-router matching sibling routes to
  // the *same* `AccountSetupRoute` element/component type at the *same* tree position does not force
  // a remount on its own — without this key, navigating choose -> import client-side (the ordinary
  // path into this step, not a fresh page load) would reuse the instance from the "choose" step,
  // where the initializer already ran with `step !== "import"` and never gets to run again.
  return <AccountSetupRouteForStep key={step} step={step} />
}

type SetupLocationState = {
  suggestedDisplayName?: string
  importProjectId?: string
} | null

// The whole setup flow's transient state, held here so the screen and the import step stay
// controlled. All of it resets on a step change (the `key={step}` remount above).
type SetupFlowState = {
  importAwaitingContinue: boolean
  // The V1 login username the import proposed as a name. The API does not store it, so it rides
  // router state from here to the name step (surviving Back, not a reload).
  v1Suggestion: string | null
  // The project the setup import put its goals in, so setup can end on it.
  importProjectId: string | null
  // A submission succeeded — the screen shows progress (or a retry) instead of the forms.
  submitted: boolean
  // Sticky, only ever set by the import step: the account has a key, so Back is hidden.
  keyImported: boolean
}

type SetupFlowAction =
  | { type: "importCompleted" }
  | { type: "keyImported" }
  | { type: "suggestionReceived"; name: string | null }
  | { type: "importProjectReceived"; projectId: string }
  | { type: "submitted" }

function setupFlowReducer(
  state: SetupFlowState,
  action: SetupFlowAction
): SetupFlowState {
  switch (action.type) {
    case "importCompleted":
      return { ...state, importAwaitingContinue: false }
    case "keyImported":
      return { ...state, keyImported: true }
    case "suggestionReceived":
      return { ...state, v1Suggestion: action.name }
    case "importProjectReceived":
      return { ...state, importProjectId: action.projectId }
    case "submitted":
      return { ...state, submitted: true }
  }
}

function initSetupFlow({
  step,
  importProjectId,
}: {
  step: AccountSetupStep
  importProjectId: string | null
}): SetupFlowState {
  return {
    importAwaitingContinue: step === "import",
    v1Suggestion: null,
    importProjectId,
    submitted: false,
    keyImported: false,
  }
}

function AccountSetupRouteForStep({ step }: { step: AccountSetupStep }) {
  const { state } = useCurrentUser()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const next = searchParams.get("next")
  // The project the setup import put its goals in, carried the same way so setup can end on it.
  const locationState = location.state as SetupLocationState
  const [flow, dispatch] = useReducer(
    setupFlowReducer,
    { step, importProjectId: locationState?.importProjectId ?? null },
    initSetupFlow
  )

  // Carried across step navigation so the remembered destination survives Back, the mobile
  // "paste a key instead" shortcut, and a reload.
  const search = next ? `?next=${encodeURIComponent(next)}` : ""

  if (
    !(step === "import" && flow.importAwaitingContinue) &&
    state.status === "success"
  ) {
    const { hasCompletedOnboarding, displayName } = state.user

    if (hasCompletedOnboarding && displayName !== null) {
      return <Navigate replace to={arrivalPath(next, flow.importProjectId)} />
    }
    // A key without a confirmed name only owes the name step.
    if (hasCompletedOnboarding && step !== "name") {
      return (
        <Navigate
          replace
          state={{
            suggestedDisplayName: flow.v1Suggestion ?? undefined,
            importProjectId: flow.importProjectId ?? undefined,
          }}
          to={`${SETUP_STEP_PATHS.name}${search}`}
        />
      )
    }
    // The name step is only reachable once a key exists.
    if (!hasCompletedOnboarding && step === "name") {
      return <Navigate replace to={`${SETUP_STEP_PATHS.choose}${search}`} />
    }
  }

  return (
    <AccountSetupScreen
      keyImported={flow.keyImported}
      onKeyImported={() => dispatch({ type: "keyImported" })}
      onStepChange={(nextStep) => {
        void navigate(`${SETUP_STEP_PATHS[nextStep]}${search}`)
      }}
      onSubmitted={() => dispatch({ type: "submitted" })}
      renderImportStep={(onCompleted, onKeyImported) => (
        <SetupV1Import
          keyImported={flow.keyImported}
          onCompleted={() => {
            dispatch({ type: "importCompleted" })
            onCompleted()
          }}
          onKeyImported={onKeyImported}
          onImportProject={(projectId) =>
            dispatch({ type: "importProjectReceived", projectId })
          }
          onSuggestedDisplayName={(name) =>
            dispatch({ type: "suggestionReceived", name })
          }
          onUseApiKey={() => void navigate(`${SETUP_STEP_PATHS.key}${search}`)}
        />
      )}
      step={step}
      submitted={flow.submitted}
      suggestedDisplayName={locationState?.suggestedDisplayName}
    />
  )
}
