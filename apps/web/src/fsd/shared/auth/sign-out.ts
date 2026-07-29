import type { AccountInfo, IPublicClientApplication } from "@azure/msal-browser"
import { deleteGameCatalogDb } from "@workspace/game-catalog"
import { deletePlayerDataDb } from "@workspace/player-data"

export async function signOut(
  instance: IPublicClientApplication,
  account: AccountInfo
): Promise<void> {
  await Promise.all([deleteGameCatalogDb(), deletePlayerDataDb()])
  await instance.logoutRedirect({ account })
}
