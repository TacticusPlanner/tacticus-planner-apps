import { createContext, useContext } from "react"

/**
 * Whether the row being rendered is its campaign group's only row. Such a group shows no header:
 * its row names the location in full ("Saim-Hann Elite 33", with the campaign icon) instead.
 */
export const LoneCampaignRowContext = createContext(false)

export function useIsLoneCampaignRow(): boolean {
  return useContext(LoneCampaignRowContext)
}
