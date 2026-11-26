import { Navigate, useLocation } from "react-router"

/** Sends a bare or unknown Survival address to the Team tab, keeping `?event=` and the rest. */
export function SurvivalTeamRedirect() {
  const { search } = useLocation()
  return <Navigate replace to={{ pathname: "/plan/survival/team", search }} />
}
