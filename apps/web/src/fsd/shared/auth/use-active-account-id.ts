import { useMsal } from "@azure/msal-react"

export function useActiveAccountId() {
  const { accounts, instance } = useMsal()

  return (instance.getActiveAccount() ?? accounts[0])?.homeAccountId
}
