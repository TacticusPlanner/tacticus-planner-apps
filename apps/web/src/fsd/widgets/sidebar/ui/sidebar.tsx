import { PanelLeft } from "lucide-react"

import { sidebarItems } from "../model/sidebar"

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col border-r border-border bg-sidebar p-3 text-sidebar-foreground">
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
        <PanelLeft className="size-4" />
        Tacticus Planner
      </div>
      <nav className="mt-3 flex flex-col gap-1">
        {sidebarItems.map((item) => (
          <a
            key={item.path}
            className="rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            href={item.path}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  )
}
