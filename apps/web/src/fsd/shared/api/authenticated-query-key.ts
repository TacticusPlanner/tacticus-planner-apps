export const authenticatedQueryKey = (accountId: string) =>
  ["account", accountId] as const
