import { safeStorage } from "@/shared/lib"

import { isAccountSetupComplete, type CurrentUser } from "./current-user"

// Which signed-in account (MSAL homeAccountId) last finished setup on this device. Only that one
// bit is kept, never the account itself (spec: onboarding-gate).
const SETUP_COMPLETE_KEY = "tp.account.setupComplete"

/** Whether `accountId` had finished setup when this device last loaded its account. */
export function readSetupCompleteHint(accountId: string | undefined) {
  return (
    accountId !== undefined && safeStorage.get(SETUP_COMPLETE_KEY) === accountId
  )
}

/** Records the account's latest definitive setup state: set when complete, dropped when not. */
export function rememberSetupState(accountId: string, user: CurrentUser) {
  if (isAccountSetupComplete(user)) {
    safeStorage.set(SETUP_COMPLETE_KEY, accountId)
  } else if (safeStorage.get(SETUP_COMPLETE_KEY) === accountId) {
    safeStorage.remove(SETUP_COMPLETE_KEY)
  }
}

/** Forgets the hint, e.g. once the account is deleted. */
export function clearSetupCompleteHint() {
  safeStorage.remove(SETUP_COMPLETE_KEY)
}
