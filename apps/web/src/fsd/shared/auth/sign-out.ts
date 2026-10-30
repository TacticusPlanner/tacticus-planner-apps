import type { IPublicClientApplication } from "@azure/msal-browser"
import { deleteGameCatalogDb } from "@workspace/game-catalog"
import { deletePlayerDataDb } from "@workspace/player-data"

import { accountStoragePrefix, safeStorage } from "@/shared/lib"
import { clearLocalDataCache } from "@/shared/local-data"

import { forgetAccountHint } from "./authentication"

export async function signOut(
  instance: IPublicClientApplication,
  accountId: string
): Promise<void> {
  await Promise.all([deleteGameCatalogDb(), deletePlayerDataDb()])
  clearLocalDataCache()
  safeStorage.removeByPrefix(accountStoragePrefix)
  // A new tab must show the signed-out experience, not try to restore this account.
  forgetAccountHint()
  const account = instance
    .getAllAccounts()
    .find((candidate) => candidate.homeAccountId === accountId)

  await instance.logoutRedirect(account ? { account } : {})
}
