import type { IPublicClientApplication } from "@azure/msal-browser"
import { deleteGameCatalogDb } from "@workspace/game-catalog"
import { deletePlayerDataDb } from "@workspace/player-data"

export async function signOut(
  instance: IPublicClientApplication,
  accountId: string
): Promise<void> {
  await Promise.all([deleteGameCatalogDb(), deletePlayerDataDb()])
  const account = instance
    .getAllAccounts()
    .find((candidate) => candidate.homeAccountId === accountId)

  await instance.logoutRedirect(account ? { account } : {})
}
