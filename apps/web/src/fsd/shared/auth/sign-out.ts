import type { IPublicClientApplication } from "@azure/msal-browser"
import { clearAccountLocalData } from "./account-local-data"
import {
  forgetAccountHint,
  forgetFreshLogin,
  forgetQuietRenewal,
} from "./authentication"

export async function signOut(
  instance: IPublicClientApplication,
  accountId: string
): Promise<void> {
  await clearAccountLocalData()
  // A new tab must show the signed-out experience, not try to restore this account.
  forgetAccountHint()
  forgetFreshLogin()
  forgetQuietRenewal()
  const account = instance
    .getAllAccounts()
    .find((candidate) => candidate.homeAccountId === accountId)

  await instance.logoutRedirect(account ? { account } : {})
}
