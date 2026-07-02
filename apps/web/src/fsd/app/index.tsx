import { createBrowserRouter, RouterProvider } from "react-router"
import { Toaster } from "@workspace/ui/components/sonner"

import { useTheme } from "@/shared/theme"
import { routes } from "./routes"

const router = createBrowserRouter(routes)

export function App() {
  const { theme } = useTheme()

  return (
    <>
      <RouterProvider router={router} />
      <Toaster theme={theme} />
    </>
  )
}
