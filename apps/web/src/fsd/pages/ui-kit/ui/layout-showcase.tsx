import { BookOpen, Box, Swords } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Separator } from "@workspace/ui/components/separator"
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
} from "@workspace/ui/components/sidebar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

export function LayoutShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <UiKitShowcaseCard title="Card composition">
        <Card data-testid="layout-card">
          <CardHeader>
            <CardTitle>Daily Raids</CardTitle>
            <CardDescription>
              Header, content, and footer slots.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cards frame repeated content and focused tool panels.
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button size="sm">Save</Button>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Accordion and tabs">
        <div className="flex flex-col gap-4" data-testid="layout-disclosure">
          <Accordion collapsible defaultValue="goals" type="single">
            <AccordionItem value="goals">
              <AccordionTrigger>Goals summary</AccordionTrigger>
              <AccordionContent>
                Active goals, planned upgrades, and completion state.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="raids">
              <AccordionTrigger>Raid plan</AccordionTrigger>
              <AccordionContent>
                Planned battles and energy allocation for the day.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator />
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground">
                Overview content sits in the first tab.
              </p>
            </TabsContent>
            <TabsContent value="details">
              <p className="text-sm text-muted-foreground">
                Details content sits in the second tab.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Scroll area">
        <ScrollArea
          className="h-40 rounded-2xl border"
          data-testid="layout-scroll-area"
        >
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 12 }, (_, index) => (
              <p className="text-sm text-muted-foreground" key={index}>
                Scroll row {index + 1}: reusable layouts stay predictable.
              </p>
            ))}
          </div>
        </ScrollArea>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard title="Sidebar composition">
        <div
          className="max-w-sm overflow-hidden rounded-2xl border"
          data-testid="layout-sidebar"
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
                        <SidebarMenuButton asChild isActive>
                          <a
                            data-testid="sidebar-preview-planner"
                            href="#layout"
                          >
                            <BookOpen />
                            <span>Campaigns</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <a
                            data-testid="sidebar-preview-inventory"
                            href="#layout"
                          >
                            <Box />
                            <span>Inventory</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </SidebarProvider>
        </div>
      </UiKitShowcaseCard>
    </div>
  )
}
