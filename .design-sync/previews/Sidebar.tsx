import { BookOpen, Box, Swords } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@workspace/ui'

// Mirrors apps/web/.../ui-kit/ui/layout-showcase.tsx. Sidebar requires a
// SidebarProvider ancestor (it reads layout state from context); `collapsible
// ="none"` renders it inline (not as the mobile sheet) so it shows in-card.
export function Composition() {
  return (
    <div
      className="max-w-sm overflow-hidden rounded-2xl border"
      style={{ width: 320 }}
    >
      <SidebarProvider className="min-h-0">
        <Sidebar collapsible="none">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <Swords />
                  <span>Tacticus Planner</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Planning</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <BookOpen />
                      <span>Campaigns</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Box />
                      <span>Inventory</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  )
}
